import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  // Get all posts
 async findAll(): Promise<any[]> {
  const posts = await this.postModel
    .find()
    .populate('author', 'name photo role')
    .populate('comments.author', 'name photo')
    .sort({ createdAt: -1 })
    .exec();

  return posts.map(post => ({
    ...post.toObject(),
    user: {
      id: String((post.author as any)._id),
      name: (post.author as any).name,
      photo: (post.author as any).photo || '',
      role: (post.author as any).role,
    },
  }));
}

  // Create a new post — only teenlancers
  async create(
    userId: string,
    userRole: string,
    dto: CreatePostDto,
  ): Promise<CommunityPostDocument> {
    if (userRole !== 'teenlancer') {
      throw new ForbiddenException('Only teenlancers can create community posts');
    }

    const post = new this.postModel({
      ...dto,
      author: userId,
    });

    return post.save();
  }

  // Like or unlike a post
  async likePost(postId: string, userId: string): Promise<CommunityPostDocument> {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId,
    );

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like
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
    { $unwind: '$user' },
    {
      $project: {
        id: { $toString: '$user._id' },
        name: '$user.name',
        photo: '$user.photo',
        postCount: 1,
      },
    },
  ]);

  return members;
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