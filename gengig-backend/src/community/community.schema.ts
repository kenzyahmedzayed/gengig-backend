import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityPostDocument = CommunityPost & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

@Schema({ timestamps: true })
export class CommunityPost {
  @Prop({ required: true })
  content!: string;

  @Prop()
  image?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  likes!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [CommentSchema], default: [] })
  comments!: Comment[];
}

export const CommunityPostSchema = SchemaFactory.createForClass(CommunityPost);