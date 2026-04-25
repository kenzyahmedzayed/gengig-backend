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
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ enum: UserRole, default: UserRole.TEENLANCER })
  role!: UserRole;

  @Prop({ select: false })
  verificationCode?: string;

  @Prop({ select: false })
  verificationCodeExpires?: Date;

  @Prop({ unique: true, lowercase: true, trim: true })
  slug?: string;

  // Profile fields
  @Prop()
  photo?: string;

  @Prop()
  bio?: string;

  @Prop()
  education?: string;

  @Prop()
  location?: string;

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

  // Onboarding
  @Prop({ default: false })
  isOnboardingComplete?: boolean;

  // Settings
  @Prop({ type: Object, default: {} })
  notificationPreferences?: Record<string, boolean>;

  // Portfolio
  @Prop({ type: [Object], default: [] })
  portfolio?: Array<{
    title: string;
    category: string;
    img: string;
  }>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Auto-generate slug from name before saving
UserSchema.pre('save', function () {
  if (this.isNew || this.isModified('name')) {
    const base = (this as any).name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    (this as any).slug = `${base}-${suffix}`;
  }
});