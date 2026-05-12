import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true })
  sessionId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true, enum: ['teenlancer', 'agent'] })
  userType!: string;
}
export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);