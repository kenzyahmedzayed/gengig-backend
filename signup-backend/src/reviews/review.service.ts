import { Injectable, NotFoundException, ForbiddenException, ConflictException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './review.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

async create(
    agentId: string,
    agentRole: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    if (agentRole !== 'agent') {
      throw new ForbiddenException('Only agents can write reviews');
    }

    const existing = await this.reviewModel.findOne({
      reviewer: agentId,
      teenlancer: dto.teenlancerId,
      gig: dto.gigId,
    });

    if (existing) {
      throw new ConflictException('You have already reviewed this teenlancer for this gig');
    }

    const review = new this.reviewModel({
      reviewer: agentId,
      teenlancer: dto.teenlancerId,
      gig: dto.gigId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return review.save();
}

async getTeenlancerReviews(teenlancerId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ teenlancer: teenlancerId })
      .populate('reviewer', 'name photo company')
      .populate('gig', 'title')
      .sort({ createdAt: -1 })
      .exec();
}

async getAgentReviews(agentId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ reviewer: agentId })
      .populate('teenlancer', 'name photo')
      .populate('gig', 'title')
      .sort({ createdAt: -1 })
      .exec();
}

async getTeenlancerRating(teenlancerId: string): Promise<any> {
    const reviews = await this.reviewModel
      .find({ teenlancer: teenlancerId })
      .exec();

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / reviews.length;

    return {
      averageRating: Math.round(average * 10) / 10,
      totalReviews: reviews.length,
    };
}

async getAgentStats(agentId: string): Promise<any> {
    const gigsPosted = await this.reviewModel.countDocuments({
      reviewer: agentId,
    });

    const reviews = await this.reviewModel
      .find({ reviewer: agentId })
      .exec();

    return {
      gigsPosted,
      totalReviews: reviews.length,
    };
}
  
async getPlatformStats(): Promise<any> {
  return {
    totalTeenlancers: 500,
    totalAgents: 200,
    totalGigs: 1000,
    avgRating: 4.8,
  };
}

async getTeenlancerStats(userId: string): Promise<any> {
  const reviews = await this.reviewModel.find({ teenlancer: userId }).exec();
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  return {
    completedGigs: 0,
    totalEarnings: 0,
    responseRate: 100,
    onTimeDelivery: 100,
    rating: Math.round(avgRating * 10) / 10,
    activeGigs: 0,
    totalReviews,
  };
}
}