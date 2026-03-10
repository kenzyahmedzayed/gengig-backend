import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  FREELANCER = 'freelancer',
  CLIENT = 'client',
}

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

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ select: false })
  verificationCode?: string;

  @Prop({ select: false })
  verificationCodeExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);