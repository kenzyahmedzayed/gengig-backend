import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GigDocument = Gig & Document;

export enum GigStatus {
  OPEN = 'open',
  ACTIVE = 'active',
  CLOSED = 'closed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Gig {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  budget: string;

  @Prop()
  duration?: string;

  @Prop()
  deadline?: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ enum: GigStatus, default: GigStatus.OPEN })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  postedBy: Types.ObjectId;

  @Prop({ default: false })
  isFeatured: boolean;
}

export const GigSchema = SchemaFactory.createForClass(Gig);