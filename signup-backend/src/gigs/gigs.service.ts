import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gig, GigDocument } from './gig.schema';
import { CreateGigDto } from './dto/create-gig.dto';

@Injectable()
export class GigsService {
  constructor(
    @InjectModel(Gig.name) private readonly gigModel: Model<GigDocument>,
  ) {}

  // Create a new gig
  async create(agentId: string, dto: CreateGigDto): Promise<any> {
  const gig = new this.gigModel({
    ...dto,
    postedBy: agentId,
    status: 'open',
  });
  const saved = await gig.save();
  return {
    success: true,
    message: 'Gig created successfully',
    id: saved._id,
    title: saved.title,
    description: saved.description,
    category: saved.category,
    budget: saved.budget,
    duration: saved.duration,
    deadline: saved.deadline || saved.duration,
    skills: saved.skills || [],
    requirements: saved.requirements || [],
    status: saved.status,
    postedBy: saved.postedBy,
    createdAt: (saved as any).createdAt,
    gig: {
      id: saved._id,
      title: saved.title,
      description: saved.description,
      category: saved.category,
      budget: saved.budget,
      duration: saved.duration,
      deadline: saved.deadline || saved.duration,
      skills: saved.skills || [],
      requirements: saved.requirements || [],
      status: saved.status,
      postedBy: saved.postedBy,
      createdAt: (saved as any).createdAt,
    }
  };
}

  // Get all gigs with optional filters
  async findAll(query: any = {}): Promise<GigDocument[]> {
    const filter: any = {};

    if (!query.status) {
      filter.status = 'open';
    } else {
      filter.status = query.status;
    }

    if (query.category) filter.category = query.category;
    if (query.budget) filter.budget = { $lte: Number(query.budget) };
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.gigModel.find(filter).populate('postedBy', 'name email photo').exec();
  }

  // Get featured gigs for homepage
  async findFeatured(): Promise<GigDocument[]> {
    return this.gigModel
      .find({ isFeatured: true, status: 'open' })
      .populate('postedBy', 'name email photo')
      .exec();
  }

  // Get single gig by ID
  async findById(id: string): Promise<GigDocument> {
    const gig = await this.gigModel
      .findById(id)
      .populate('postedBy', 'name email photo')
      .exec();

    if (!gig) throw new NotFoundException('Gig not found');
    return gig;
  }

  // Get gigs by agent
  async findByAgent(agentId: string, status?: string): Promise<GigDocument[]> {
  const filter: any = { postedBy: agentId };
  if (status) filter.status = status;
  return this.gigModel.find(filter).exec();
}

  // Update a gig
  async update(id: string, agentId: string, data: Partial<Gig>): Promise<GigDocument | null> {
    const gig = await this.gigModel.findById(id);
    if (!gig) throw new NotFoundException('Gig not found');
    if (String(gig.postedBy) !== agentId) {
      throw new ForbiddenException('You can only update your own gigs');
    }
    return this.gigModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

  // Delete a gig
  async delete(id: string, agentId: string): Promise<void> {
    const gig = await this.gigModel.findById(id);
    if (!gig) throw new NotFoundException('Gig not found');
    if (String(gig.postedBy) !== agentId) {
      throw new ForbiddenException('You can only delete your own gigs');
    }
    await this.gigModel.findByIdAndDelete(id).exec();
  }
  async getRecommended(userId: string): Promise<GigDocument[]> {
  return this.gigModel
    .find({ status: 'open' })
    .populate('postedBy', 'name email photo')
    .limit(6)
    .exec();
}

async getRelated(gigId: string): Promise<GigDocument[]> {
  const gig = await this.gigModel.findById(gigId).exec();
  if (!gig) throw new NotFoundException('Gig not found');

  return this.gigModel
    .find({
      category: gig.category,
      _id: { $ne: gigId },
      status: 'open',
    })
    .populate('postedBy', 'name email photo')
    .limit(4)
    .exec();
}

async saveGig(gigId: string, userId: string): Promise<any> {
  return { message: 'Gig saved successfully', gigId, userId };
}
}
