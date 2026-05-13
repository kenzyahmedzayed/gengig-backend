import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityPost, CommunityPostDocument } from './community.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(CommunityPost.name)
    private readonly postModel: Model<CommunityPostDocument>,
  ) {}

  private formatPost(post: any) {
    const author = post.author as any;

    return {
      ...post.toObject(),
      user: author
        ? {
            id: String(author._id),
            name: author.name,
            photo: author.photo || '',
            role: author.role,
          }
        : null,
    };
  }

  async findAll(): Promise<any[]> {
  const posts = await this.postModel
    .find()
    .populate('author', 'name photo role')
    .populate('comments.author', 'name photo')
    .sort({ createdAt: -1 })
    .exec();

  return posts
    .filter(post => post.author != null)
    .map(post => ({
      ...post.toObject(),
      user: {
        id: String((post.author as any)._id),
        name: (post.author as any).name || 'Unknown User',
        photo: (post.author as any).photo || '',
        role: (post.author as any).role || 'teenlancer',
      },
    }));
}

  async create(
    userId: string,
    userRole: string,
    dto: CreatePostDto,
  ): Promise<any> {
    if (userRole !== 'teenlancer') {
      throw new ForbiddenException('Only teenlancers can create community posts');
    }

    const post = new this.postModel({
      ...dto,
      content: dto.content.trim(),
      author: userId,
    });

    const savedPost = await post.save();
    const populatedPost = await savedPost.populate([
      { path: 'author', select: 'name photo role' },
      { path: 'comments.author', select: 'name photo' },
    ]);

    return this.formatPost(populatedPost);
  }

  async likePost(postId: string, userId: string): Promise<CommunityPostDocument> {
  if (!postId || postId === 'undefined') {
    throw new BadRequestException('Invalid post ID');
  }

  const post = await this.postModel.findById(postId);
  if (!post) throw new NotFoundException('Post not found');

  const alreadyLiked = post.likes.some(
    (id) => id.toString() === userId,
  );

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(userId as any);
  }

  return post.save();
}

  // Add a comment
  async addComment(
    postId: string,
    userId: string,
    userRole: string,
    dto: CreateCommentDto,
  ): Promise<CommunityPostDocument> {
    if (userRole !== 'teenlancer') {
      throw new ForbiddenException('Only teenlancers can comment on posts');
    }

    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    post.comments.push({
      author: userId as any,
      content: dto.content,
      createdAt: new Date(),
    });

    return post.save();
  }

  // Get comments for a post
  async getComments(postId: string) {
    const post = await this.postModel
      .findById(postId)
      .populate('comments.author', 'name photo')
      .exec();

    if (!post) throw new NotFoundException('Post not found');
    return post.comments;
  }

  // Get active members
async getActiveMembers() {
  const members = await this.postModel.aggregate([
    { $group: { _id: '$author', postCount: { $sum: 1 } } },
    { $sort: { postCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
{ $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },    {
      $project: {
        id: { $toString: '$user._id' },
        name: { $ifNull: ['$user.name', 'Unknown User'] },
        photo: { $ifNull: ['$user.photo', ''] },
        postCount: 1,
      },
    },
  ]);

  // Filter out any members with missing data
  return members.filter(m => m.name && m.id);
}

  // Get trending tags
  async getTrendingTags() {
    return this.postModel.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ]);
  }
}
