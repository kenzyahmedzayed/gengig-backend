import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WORK_SUBMITTED = 'work_submitted',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
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

  @Prop({ type: Object })
  workSubmission?: {
    description: string;
    deliverables: string;
    portfolioLink: string;
    fileUrl: string;
    notes: string;
    submittedAt: Date;
  };

  @Prop({ default: 'pending', enum: ['pending', 'held', 'released'] })
  paymentStatus?: string;

  @Prop({ default: 0 })
  paymentAmount?: number;

  @Prop({ default: 0 })
  revisionCount?: number;

  @Prop()
  revisionReason?: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);