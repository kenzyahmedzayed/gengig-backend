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
  async create(agentId: string, dto: CreateGigDto): Promise<GigDocument> {
    const gig = new this.gigModel({
      ...dto,
      postedBy: agentId,
    });
    return gig.save();
  }

  // Get all gigs with optional filters
  async findAll(query: any = {}): Promise<GigDocument[]> {
    const filter: any = { status: 'open' };

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
  async findByAgent(agentId: string): Promise<GigDocument[]> {
    return this.gigModel.find({ postedBy: agentId }).exec();
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
}