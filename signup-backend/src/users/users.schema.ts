import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  TEENLANCER = 'teenlancer',
  AGENT = 'agent',
  ADMIN = 'admin',
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

  @Prop({ enum: UserRole, default: UserRole.TEENLANCER })
role: UserRole;

  @Prop({ select: false })
  verificationCode?: string;

  @Prop({ select: false })
  verificationCodeExpires?: Date;
  @Prop()
  photo?: string;

  // Teenlancer fields
  @Prop()
  bio?: string;

  @Prop()
  education?: string;

  @Prop({ type: [String], default: [] })
  skills?: string[];

  @Prop()
  availability?: string;

  @Prop()
  rate?: number;

  // Agent fields
  @Prop()
  company?: string;

  @Prop()
  industry?: string;

  @Prop({ type: [String], default: [] })
  workTypes?: string[];

  @Prop({ default: false })
  isOnboardingComplete?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);