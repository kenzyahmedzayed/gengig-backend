import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gig, GigSchema } from './gig.schema';
import { GigsService } from './gigs.service';
import { GigsController } from './gigs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Gig.name, schema: GigSchema }]),
  ],
  providers: [GigsService],
  controllers: [GigsController],
  exports: [GigsService],
})
export class GigsModule {}