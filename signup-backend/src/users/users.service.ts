import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService{
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ){}

    async create(data: Partial<User>): Promise<UserDocument>{
        return new this.userModel(data).save()
    }

    async findByEmail(email: string): Promise<UserDocument | null>{
        return this.userModel.findOne({ email }).exec();
    }

    async findByEmailWithVerification(email: string): Promise<UserDocument | null> {
  return this.userModel
    .findOne({ email })
    .select('+verificationCode +verificationCodeExpires')
    .exec();
}

    async findById(id: string): Promise<UserDocument | null>{
        return this.userModel.findById(id).exec();
    }
    
    async findByVerificationToken(token: string): Promise<UserDocument | null>{
        return this.userModel
      .findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      })
      .select('+emailVerificationToken +emailVerificationExpires')
      .exec();
    }

    async updateById(id: string, data: Partial<User>): Promise<UserDocument | null>{
        return this.userModel.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
    }

    async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
  return this.userModel
    .findOne({ email })
    .select('+password')
    .exec();
}

}