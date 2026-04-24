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
  emailVerificationToken?: string;

  @Prop({ select: false })
  emailVerificationExpires?: Date;

  // 🔗 Slug: auto-generated URL-friendly identifier, e.g. "john-doe-a1b2"
  @Prop({ unique: true, lowercase: true, trim: true })
  slug: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Auto-generate slug from name before saving (e.g. "John Doe" → "john-doe-a1b2")
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
