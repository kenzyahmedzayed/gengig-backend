import { Injectable, NotFoundException, ForbiddenException, ConflictException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Gig, GigDocument } from '../gigs/gig.schema';
import { Notification, NotificationDocument } from '../notifications/notification.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Gig.name)
    private readonly gigModel: Model<GigDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

async apply(
  teenlancerId: string,
  gigId: string,
  dto: CreateApplicationDto,
): Promise<ApplicationDocument> {
  const existing = await this.applicationModel.findOne({
    appliedBy: teenlancerId,
    gig: gigId,
  });

  if (existing) {
    throw new ConflictException('You have already applied to this gig');
  }

  const application = new this.applicationModel({
    appliedBy: teenlancerId,
    gig: gigId,
    ...dto,
  });

  await application.save();

  const gig = await this.gigModel.findById(gigId).exec();
  if (gig) {
    await this.notificationsService.create(
  String(gig.postedBy),
    'New Application! 🎉',
    `Someone applied to your gig "${gig.title}"`,
    'new_application',
);
  }
  return application;
}

async findByAgent(agentId: string): Promise<any[]> {
  const apps = await this.applicationModel
    .find()
    .populate({
      path: 'gig',
      match: { postedBy: agentId },
    })
    .populate('appliedBy', 'name photo skills bio')
    .exec();

  return apps
    .filter(app => app.gig !== null)
    .map(app => ({
      _id: app._id,
      status: app.status,
      coverLetter: app.coverLetter,
      proposedRate: app.proposedRate,
      deliveryTimeline: app.deliveryTimeline,
      appliedAt: (app as any).createdAt,
      gigTitle: (app.gig as any)?.title || 'Untitled Gig',
      gigId: (app.gig as any)?._id,
      applicant: {
        _id: (app.appliedBy as any)?._id,
        name: (app.appliedBy as any)?.name || 'Unknown',
        photo: (app.appliedBy as any)?.photo || '',
        skills: (app.appliedBy as any)?.skills || [],
        bio: (app.appliedBy as any)?.bio || '',
      },
    }));
}

async getCounts(agentId: string): Promise<any> {
    const applications = await this.findByAgent(agentId);
    return {
      all: applications.length,
      pending: applications.filter(a => a.status === ApplicationStatus.PENDING).length,
      accepted: applications.filter(a => a.status === ApplicationStatus.ACCEPTED).length,
      rejected: applications.filter(a => a.status === ApplicationStatus.REJECTED).length,
    };
  }

async findByTeenlancer(teenlancerId: string): Promise<any[]> {
  const apps = await this.applicationModel
    .find({ appliedBy: teenlancerId })
    .populate('gig', 'title category budget postedBy status')
    .exec();

  return apps.map(app => ({
    _id: app._id,
    status: app.status,
    coverLetter: app.coverLetter,
    proposedRate: app.proposedRate,
    deliveryTimeline: app.deliveryTimeline,
    appliedAt: (app as any).createdAt,
    gigTitle: (app.gig as any)?.title || 'Untitled Gig',
    gigCategory: (app.gig as any)?.category || '',
    gigBudget: (app.gig as any)?.budget || '',
    gigStatus: (app.gig as any)?.status || '',
    gigId: (app.gig as any)?._id,
  }));
}

async accept(id: string, agentId: string): Promise<ApplicationDocument> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  const gig = application.gig as any;
  if (String(gig.postedBy) !== agentId) {
    throw new ForbiddenException('You can only manage applications for your own gigs');
  }

  application.status = ApplicationStatus.ACCEPTED;
  await application.save();

  await this.gigModel.findByIdAndUpdate(gig._id, {
    status: 'active',
    acceptedTeenlancer: application.appliedBy,
  });

  await this.applicationModel.updateMany(
    { gig: gig._id, _id: { $ne: id } },
    { status: ApplicationStatus.REJECTED }
  );

  await this.notificationsService.create(
  String(application.appliedBy),
  'Application Accepted! 🎉',
  `Congratulations! Your application for "${gig.title}" has been accepted.`,
  'application_accepted',
  );

  return application;
}

async reject(id: string, agentId: string): Promise<ApplicationDocument> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  const gig = application.gig as any;
  if (String(gig.postedBy) !== agentId) {
    throw new ForbiddenException('You can only manage applications for your own gigs');
  }

  application.status = ApplicationStatus.REJECTED;
  await application.save();

  await this.notificationsService.create(
  String(application.appliedBy),
  'Application Update',
  `Your application for "${gig.title}" was not selected this time.`,
  'application_rejected',
  );

  return application;
}

async reset(id: string, agentId: string): Promise<ApplicationDocument> {
    return this.updateStatus(id, agentId, ApplicationStatus.PENDING);
}

private async updateStatus(
    id: string,
    agentId: string,
    status: ApplicationStatus,
  ): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .populate('gig')
      .exec();

    if (!application) throw new NotFoundException('Application not found');

    const gig = application.gig as any;
    if (String(gig.postedBy) !== agentId) {
      throw new ForbiddenException('You can only manage applications for your own gigs');
    }

    application.status = status;
    return application.save();
  }

async getTeenlancerDashboard(userId: string): Promise<any> {
    const applications = await this.applicationModel
      .find({ appliedBy: userId })
      .populate('gig')
      .exec();

    const activeGigs = applications.filter(a => a.status === 'accepted').length;
    const completedGigs = applications.filter(a => (a.status as string) === 'completed').length;
    return {
      activeGigs,
      completedGigs,
      recentActivity: applications.slice(0, 5),
    };
  }

async getAgentDashboard(userId: string): Promise<any> {
    const applications = await this.applicationModel
      .find()
      .populate({
        path: 'gig',
        match: { postedBy: userId },
      })
      .exec()
      .then(apps => apps.filter(app => app.gig !== null));

    const activeGigs = applications.filter(a => a.status === 'pending').length;
    const completedGigs = applications.filter(a => a.status === 'accepted').length;

    return {
      activeGigs,
      completedGigs,
      recentApplications: applications.slice(0, 5),
      spendingSummary: {
        totalSpent: 0,
        thisMonth: 0,
      },
    };
  }

async submitWork(id: string, teenlancerId: string, body: any): Promise<any> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  application.status = ApplicationStatus.WORK_SUBMITTED;
  application.workSubmission = {
    description: body.description || '',
    deliverables: body.deliverables || '',
    portfolioLink: body.portfolioLink || '',
    fileUrl: body.fileUrl || body.file || '',
    notes: body.notes || '',
    submittedAt: new Date(),
  };

  await application.save();

  const gig = application.gig as any;
  await this.notificationsService.create(
  String(gig.postedBy),
  'Work Submitted! 📦',
  `A teenlancer submitted work for "${gig.title}". Please review it.`,
  'general',
  );

  return { success: true, message: 'Work submitted successfully' };
}

async getSubmission(id: string): Promise<any> {
  const application = await this.applicationModel
    .findById(id)
    .populate('appliedBy', 'name photo')
    .populate('gig', 'title budget')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  return {
    ...application.workSubmission,
    teenlancer: application.appliedBy,
    amount: application.paymentAmount,
    status: application.status,
  };
}

async approveWork(id: string, agentId: string): Promise<any> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  const gig = application.gig as any;
  if (String(gig.postedBy) !== agentId) {
    throw new ForbiddenException('Not authorized');
  }

  application.status = ApplicationStatus.COMPLETED;
  application.paymentStatus = 'released';
  await application.save();

  await this.gigModel.findByIdAndUpdate(gig._id, { status: 'completed' });

  await this.notificationsService.create(
  String(application.appliedBy),
  'Work Approved! 🎉',
  `Your work for "${gig.title}" has been approved! Payment has been released.`,
  'application_accepted',
  );

  return { success: true, message: 'Work approved and payment released' };
}

async rejectWork(id: string, agentId: string, reason: string): Promise<any> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  const gig = application.gig as any;

  application.status = ApplicationStatus.ACCEPTED;
  await application.save();

  await this.notificationModel.create({
    userId: application.appliedBy,
    type: 'general',
    title: 'Revision Requested 🔄',
    message: `Agent requested revision for "${gig.title}": ${reason}`,
    isRead: false,
  });

  return { success: true, message: 'Revision requested' };
}

async reviewTeenlancer(id: string, agentId: string, body: { stars: number; text: string }): Promise<any> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  await this.notificationModel.create({
    userId: application.appliedBy,
    type: 'new_review',
    title: 'New Review! ⭐',
    message: `You received a ${body.stars}-star review!`,
    isRead: false,
  });

  return { success: true, message: 'Review submitted' };
}

async findById(id: string, userId: string): Promise<any> {
  const application = await this.applicationModel
    .findById(id)
    .populate('gig', 'title category budget deadline status')
    .populate('appliedBy', 'name photo')
    .exec();

  if (!application) throw new NotFoundException('Application not found');

  return {
    _id: application._id,
    status: application.status,
    coverLetter: application.coverLetter,
    proposedRate: application.proposedRate,
    deliveryTimeline: application.deliveryTimeline,
    workSubmission: application.workSubmission,
    paymentStatus: application.paymentStatus,
    appliedAt: (application as any).createdAt,
    gig: application.gig,
  };
}
}