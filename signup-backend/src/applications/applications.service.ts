import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Gig, GigDocument } from '../gigs/gig.schema';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Gig.name)
    private readonly gigModel: Model<GigDocument>,
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

    return application.save();
  }

  async findByAgent(agentId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find()
      .populate({
        path: 'gig',
        match: { postedBy: agentId },
      })
      .populate('appliedBy', 'name email photo bio skills')
      .exec()
      .then(apps => apps.filter(app => app.gig !== null));
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

  async findByTeenlancer(teenlancerId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ appliedBy: teenlancerId })
      .populate('gig')
      .exec();
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

    // Update application status to accepted
    application.status = ApplicationStatus.ACCEPTED;
    await application.save();

    // Update gig status to active
    await this.gigModel.findByIdAndUpdate(gig._id, {
      status: 'active',
      acceptedTeenlancer: application.appliedBy,
    });

    // Reject all other applications for this gig
    await this.applicationModel.updateMany(
      { gig: gig._id, _id: { $ne: id } },
      { status: ApplicationStatus.REJECTED }
    );

    return application;
  }

  async reject(id: string, agentId: string): Promise<ApplicationDocument> {
    return this.updateStatus(id, agentId, ApplicationStatus.REJECTED);
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
}