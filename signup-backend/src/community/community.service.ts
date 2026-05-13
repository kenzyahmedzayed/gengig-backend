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

private formatComment(c: any) {
  const author = c.author as any;

  return {
    _id: c._id,
    content: c.content,
    text: c.content,
    author: {
      _id: author?._id,
      name: author?.name || 'Unknown',
      photo: author?.photo || '',
    },
    user: {
      id: author?._id ? String(author._id) : undefined,
      name: author?.name || 'Unknown',
      img: author?.photo || '',
    },
    createdAt: c.createdAt,
  };
}

async findAll(): Promise<any[]> {
    const posts = await this.postModel
      .find()
      .populate('author', 'name photo role')
      .populate('comment.author', 'name photo')
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
        comments: (post.comment || []).map(c => this.formatComment(c)),
        comment: (post.comment || []).map(c => this.formatComment(c)),
        commentsCount: (post.comment || []).length,
        commentCount: (post.comment || []).length,
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
    comment: [],
  });

  const populatedPost = await post.populate('author', 'name photo role');
  const author = populatedPost.author as any;

  return {
    _id: populatedPost._id,
    content: populatedPost.content,
    tags: populatedPost.tags || [],
    image: populatedPost.image,
    likes: populatedPost.likes || [],
    likesCount: 0,
    comments: [],
    comment: [],
    commentsCount: 0,
    commentCount: 0,
    createdAt: (populatedPost as any).createdAt,
    user: {
      id: String(author._id),
      name: author.name || 'Unknown',
      photo: author.photo || '',
      img: author.photo || '',
      role: author.role || 'teenlancer',
    },
  };
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
          comment: {
            author: userId,
            content,
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' },
    )
    .populate('comment.author', 'name photo')
    .exec();

  if (!post) throw new NotFoundException('Post not found');

  const newComment = post.comment[post.comment.length - 1];
  const formattedComments = post.comment.map(c => this.formatComment(c));
  const formattedNewComment = this.formatComment(newComment);

  return {
    newComment: formattedNewComment,
    comment: formattedNewComment,
    comments: formattedComments,
    commentsCount: post.comment.length,
    commentCount: post.comment.length,
  };
}
  
async getComment(postId: string): Promise<any> {
    const post = await this.postModel
      .findById(postId)
      .populate('comment.author', 'name photo')
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    return post.comment.map(c => this.formatComment(c));
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
    .populate('comment.author', 'name photo')
    .exec();

  if (!post) throw new NotFoundException('Post not found');

  return {
    _id: post._id,
    content: post.content,
    tags: Array.isArray(post.tags) ? post.tags.filter(t => t && t !== '[]') : [],
    image: post.image,
    likes: post.likes || [],
    likesCount: (post.likes || []).length,
    comments: (post.comment || []).map(c => this.formatComment(c)),
    comment: (post.comment || []).map(c => this.formatComment(c)),
    commentsCount: (post.comment || []).length,
    commentCount: (post.comment || []).length,
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
