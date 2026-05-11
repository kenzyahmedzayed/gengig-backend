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

  async findFeatured(): Promise<GigDocument[]> {
    return this.gigModel
      .find({ isFeatured: true, status: 'open' })
      .populate('postedBy', 'name email photo')
      .exec();
  }

  async findById(id: string): Promise<GigDocument> {
  if (!id || id === 'undefined') {
    throw new NotFoundException('Invalid gig ID');
  }
  const gig = await this.gigModel
    .findById(id)
    .populate('postedBy', 'name photo company')
    .exec();
  if (!gig) throw new NotFoundException('Gig not found');
  return gig;
}

  async findByAgent(agentId: string, status?: string): Promise<any[]> {
  const filter: any = { postedBy: agentId };
  if (status && status !== 'all') {
    filter.status = status.toLowerCase();
  }

  const gigs = await this.gigModel
    .find(filter)
    .sort({ createdAt: -1 })
    .exec();

  return gigs.map(gig => ({
    _id: gig._id,
    title: gig.title,
    category: gig.category,
    budget: gig.budget,
    status: gig.status,
    deadline: gig.deadline,
    duration: gig.duration,
    skills: gig.skills,
    isFeatured: gig.isFeatured,
    createdAt: (gig as any).createdAt,
  }));
}

  async update(id: string, agentId: string, data: Partial<Gig>): Promise<GigDocument | null> {
    const gig = await this.gigModel.findById(id);
    if (!gig) throw new NotFoundException('Gig not found');
    if (String(gig.postedBy) !== agentId) {
      throw new ForbiddenException('You can only update your own gigs');
    }
    return this.gigModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }

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
  const gig = await this.gigModel.findById(gigId);
  if (!gig) throw new NotFoundException('Gig not found');

  const savedBy = gig.savedBy || [];
  const alreadySaved = savedBy.some(id => id.toString() === userId);

  if (alreadySaved) {
    gig.savedBy = savedBy.filter(id => id.toString() !== userId) as any;
  } else {
    (gig.savedBy as any[]).push(userId);
  }

  await gig.save();
  return { saved: !alreadySaved, gigId };
}
async completeGig(gigId: string, agentId: string): Promise<GigDocument> {
  const gig = await this.gigModel.findOne({ _id: gigId, postedBy: agentId });
  if (!gig) throw new NotFoundException('Gig not found');
  gig.status = 'completed';
  return gig.save();
}
async getSavedGigs(userId: string): Promise<any[]> {
  const gigs = await this.gigModel
    .find({ savedBy: userId })
    .populate('postedBy', 'name photo company')
    .sort({ createdAt: -1 })
    .exec();
  return gigs;
}
}
