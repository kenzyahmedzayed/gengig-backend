import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewer!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teenlancer!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Gig', required: true })
  gig!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ required: true })
  comment!: string;
}
export const ReviewSchema = SchemaFactory.createForClass(Review);