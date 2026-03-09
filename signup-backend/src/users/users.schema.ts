import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ select: false })
  verificationCode?: string;

  @Prop({ select: false })
  verificationCodeExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);