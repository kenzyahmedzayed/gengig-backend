import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityPost, CommunityPostSchema } from './community.schema';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunityPost.name, schema: CommunityPostSchema },
    ]),
  ],
  providers: [CommunityService],
  controllers: [CommunityController],
})
export class CommunityModule {}