import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  GIG_APPLICATION = 'gig_application',
  APPLICATION_ACCEPTED = 'application_accepted',
  APPLICATION_REJECTED = 'application_rejected',
  NEW_REVIEW = 'new_review',
  GENERAL = 'general',
  NEW_APPLICATION = 'new_application',
  NEW_MESSAGE = 'new_message',
  PAYMENT = 'payment',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ 
    enum: Object.values(NotificationType), 
    default: NotificationType.GENERAL 
  })
  type!: string;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop()
  link?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);