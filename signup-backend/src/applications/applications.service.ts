import {Injectable, NotFoundException, ForbiddenException, ConflictException,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
  ) {}

  // Teenlancer applies to a gig
  async apply(
    teenlancerId: string,
    gigId: string,
    dto: CreateApplicationDto,
  ): Promise<ApplicationDocument> {
    // Check if already applied
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

  // Agent gets all applications for their gigs
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

  // Get application counts by status for an agent
  async getCounts(agentId: string): Promise<any> {
    const applications = await this.findByAgent(agentId);

    return {
      all: applications.length,
      pending: applications.filter(a => a.status === ApplicationStatus.PENDING).length,
      accepted: applications.filter(a => a.status === ApplicationStatus.ACCEPTED).length,
      rejected: applications.filter(a => a.status === ApplicationStatus.REJECTED).length,
    };
  }

  // Get teenlancer's applications
  async findByTeenlancer(teenlancerId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ appliedBy: teenlancerId })
      .populate('gig')
      .exec();
  }

  // Accept an application
  async accept(id: string, agentId: string): Promise<ApplicationDocument> {
    return this.updateStatus(id, agentId, ApplicationStatus.ACCEPTED);
  }

  // Reject an application
  async reject(id: string, agentId: string): Promise<ApplicationDocument> {
    return this.updateStatus(id, agentId, ApplicationStatus.REJECTED);
  }

  // Reset application status back to pending
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