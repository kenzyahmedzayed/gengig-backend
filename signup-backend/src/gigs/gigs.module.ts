import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GigsController } from './gigs.controller';
import { GigsAliasController } from './gigs-alias.controller';
import { GigsService } from './gigs.service';
import { Gig, GigSchema } from './gig.schema';
import { User, UserSchema } from '../users/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gig.name, schema: GigSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GigsController, GigsAliasController],
  providers: [GigsService],
  exports: [GigsService],
})
export class GigsModule {}