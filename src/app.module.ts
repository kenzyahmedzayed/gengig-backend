import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
@Module({
  imports: [
MongooseModule.forRoot('mongodb://localhost:27017/gengig')  ],
})

export class AppModule {}
