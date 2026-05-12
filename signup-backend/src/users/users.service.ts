import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService{
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
){}

async create(data: Partial<User>): Promise<UserDocument>{
  return new this.userModel(data).save()
}

async findByEmail(email: string): Promise<UserDocument | null>{
  return this.userModel.findOne({ email }).exec();
}

async findByEmailWithVerification(email: string): Promise<UserDocument | null> {
  return this.userModel
    .findOne({ email })
    .select('+verificationCode +verificationCodeExpires')
    .exec();
}

async findById(id: string): Promise<UserDocument | null> {
  return this.userModel.findById(id).select('-password -verificationCode -verificationCodeExpires').exec();
}
    
async findByVerificationToken(token: string): Promise<UserDocument | null>{
  return this.userModel
    .findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    })
    .select('+emailVerificationToken +emailVerificationExpires')
    .exec();
}

async updateById(id: string, data: Partial<User>): Promise<UserDocument | null>{
  return this.userModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
}

async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
  return this.userModel
    .findOne({ email })
    .select('+password')
    .exec();
}

async deleteById(id: string): Promise<void> {
  await this.userModel.findByIdAndDelete(id).exec();
}

async getTeenlancerStats(userId: string): Promise<any> {
  const user = await this.userModel.findById(userId).exec();
  if (!user) throw new Error('User not found');

  return {
    totalEarnings: 0,
    activeGigs: 0,
    completedGigs: 0,
    rating: 0,
    totalReviews: 0,
  };
}

async getTeenlancerActivity(userId: string): Promise<any> {
  return {
    activities: [],
    message: 'No recent activity',
  };
}

async getTeenlancerDashboard(userId: string): Promise<any> {
  const user = await this.userModel.findById(userId).exec();
  if (!user) throw new Error('User not found');

  return {
    activeGigs: 0,
    completedGigs: 0,
    recentActivity: [],
    user: {
      name: user.name,
      photo: user.photo,
      role: user.role,
    }
  };
}

async getAgentDashboard(userId: string): Promise<any> {
  const user = await this.userModel.findById(userId).exec();
  if (!user) throw new Error('User not found');

  return {
    activeGigs: 0,
    completedGigs: 0,
    recentApplications: [],
    spendingSummary: {
      totalSpent: 0,
      thisMonth: 0,
    },
    user: {
      name: user.name,
      photo: user.photo,
      role: user.role,
    }
  };
}

async getPlatformStats(): Promise<any> {
  const totalTeenlancers = await this.userModel.countDocuments({ role: 'teenlancer' }).exec();
  const totalAgents = await this.userModel.countDocuments({ role: 'agent' }).exec();

  return {
    totalTeenlancers,
    totalAgents,
    totalGigs: 0,
    avgRating: 4.8,
  };
}

async getTeenlancers(query: any): Promise<any> {
  const filter: any = { role: 'teenlancer' };

  if (query.skill) {
    filter.skills = { $in: [query.skill] };
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { skills: { $in: [new RegExp(query.search, 'i')] } },
    ];
  }

  const limit = query.limit ? parseInt(query.limit) : 10;

  const teenlancers = await this.userModel
    .find(filter)
    .select('name photo skills bio rate availability')
    .limit(limit)
    .exec();

  return teenlancers.map(t => ({
    id: String(t._id),
    name: t.name,
    photo: t.photo || '',
    skills: t.skills || [],
    bio: t.bio || '',
    rate: t.rate || 0,
    availability: t.availability || '',
  }));
}

async getAgentStats(agentId: string): Promise<any> {
  return {
    totalSpent: '$0',
    teenlancersHired: 0,
    completedGigs: 0,
    avgPerGig: '—',
  };
}
}