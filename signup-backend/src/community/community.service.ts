import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunityPost, CommunityPostDocument } from './community.schema';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(CommunityPost.name)
    private readonly postModel: Model<CommunityPostDocument>,
  ) {}

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
        _id: post._id,
        content: post.content,
        tags: Array.isArray(post.tags) ? post.tags.filter(t => t && t !== '[]') : [],
        image: post.image,
        likes: post.likes || [],
        likesCount: (post.likes || []).length,
        comments: (post.comments || []).map(c => ({
          _id: (c as any)._id,
          content: c.content,
          author: {
            _id: (c.author as any)?._id,
            name: (c.author as any)?.name || 'Unknown',
            photo: (c.author as any)?.photo || '',
          },
          createdAt: (c as any).createdAt,
        })),
        commentsCount: (post.comments || []).length,
        createdAt: (post as any).createdAt,
        user: {
          id: String((post.author as any)._id),
          name: (post.author as any).name || 'Unknown',
          photo: (post.author as any).photo || '',
          role: (post.author as any).role || 'teenlancer',
        },
      }));
}

async create(userId: string, role: string, data: any): Promise<any> {
  let tags = [];
  if (data.tags) {
    if (Array.isArray(data.tags)) {
      tags = data.tags.filter((t: string) => t && t !== '[]' && t.trim() !== '');
    } else if (typeof data.tags === 'string') {
      tags = data.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t && t !== '[]');
    }
  }

  const post = await this.postModel.create({
    author: userId,
    content: data.content,
    tags,
    image: data.image || '',
    likes: [],
    comments: [],
  });

  return post.populate('author', 'name photo role');
}

async likePost(postId: string, userId: string): Promise<any> {
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
    await post.save();
    return {
      _id: post._id,
      likesCount: post.likes.length,
      likes: post.likes,
      isLiked: !alreadyLiked,
    };
}

async addComment(postId: string, userId: string, role: string, dto: any): Promise<any> {
  if (!postId || postId === 'undefined') {
    throw new BadRequestException('Invalid post ID');
  }
  const content = dto.content || dto.text || dto.comment || dto.message || '';

  if (!content) {
    throw new BadRequestException('Comment content is required');
  }

  const post = await this.postModel
    .findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            author: userId,
            content,
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    )
    .populate('comments.author', 'name photo')
    .exec();

  if (!post) throw new NotFoundException('Post not found');

  const newComment = post.comments[post.comments.length - 1];

  return {
    // Return all 3 formats so frontend can handle any
    comment: {
      _id: (newComment as any)._id,
      content: (newComment as any).content,
      text: (newComment as any).content,
      author: {
        _id: (newComment.author as any)?._id,
        name: (newComment.author as any)?.name || 'Unknown',
        photo: (newComment.author as any)?.photo || '',
      },
      createdAt: (newComment as any).createdAt,
    },
    comments: post.comments.map(c => ({
      _id: (c as any)._id,
      content: c.content,
      text: c.content,
      author: {
        _id: (c.author as any)?._id,
        name: (c.author as any)?.name || 'Unknown',
        photo: (c.author as any)?.photo || '',
      },
      createdAt: (c as any).createdAt,
    })),
    commentsCount: post.comments.length,
  };
}
  
async getComments(postId: string): Promise<any> {
    const post = await this.postModel
      .findById(postId)
      .populate('comments.author', 'name photo')
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    return post.comments.map(c => ({
      _id: (c as any)._id,
      content: c.content,
      author: {
        _id: (c.author as any)?._id,
        name: (c.author as any)?.name || 'Unknown',
        photo: (c.author as any)?.photo || '',
      },
      createdAt: (c as any).createdAt,
    }));
}

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
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          id: { $toString: '$user._id' },
          name: { $ifNull: ['$user.name', 'Unknown User'] },
          photo: { $ifNull: ['$user.photo', ''] },
          postCount: 1,
        },
      },
    ]);
    return members.filter(m => m.name && m.id);
}

async getTrendingTags(): Promise<any[]> {
    const posts = await this.postModel.find().select('tags').exec();
    const tagCount: Record<string, number> = {};

    for (const post of posts) {
      if (Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          if (tag && tag !== '[]' && tag.trim() !== '') {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          }
        }
      }
    }
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
}
  
async findOne(postId: string): Promise<any> {
  const post = await this.postModel
    .findById(postId)
    .populate('author', 'name photo role')
    .populate('comments.author', 'name photo')
    .exec();

  if (!post) throw new NotFoundException('Post not found');

  return {
    _id: post._id,
    content: post.content,
    tags: Array.isArray(post.tags) ? post.tags.filter(t => t && t !== '[]') : [],
    image: post.image,
    likes: post.likes || [],
    likesCount: (post.likes || []).length,
    comments: (post.comments || []).map(c => ({
      _id: (c as any)._id,
      content: c.content,
      author: {
        _id: (c.author as any)?._id,
        name: (c.author as any)?.name || 'Unknown',
        photo: (c.author as any)?.photo || '',
      },
      createdAt: (c as any).createdAt,
    })),
    commentsCount: (post.comments || []).length,
    createdAt: (post as any).createdAt,
    user: {
      id: String((post.author as any)._id),
      name: (post.author as any).name || 'Unknown',
      photo: (post.author as any).photo || '',
      role: (post.author as any).role || 'teenlancer',
    },
  };
}
}