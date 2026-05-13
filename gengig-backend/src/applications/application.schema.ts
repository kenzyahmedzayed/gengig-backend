import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  appliedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Gig', required: true })
  gig!: Types.ObjectId;

  @Prop({ required: true })
  coverLetter!: string;

  @Prop({ enum: ApplicationStatus, default: ApplicationStatus.PENDING })
  status!: ApplicationStatus;

  @Prop()
  portfolioLink?: string;

  @Prop()
  proposedRate?: string;

  @Prop()
  deliveryTimeline?: string;

  @Prop()
  sampleWork?: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);