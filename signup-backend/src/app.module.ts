import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb+srv://gengig2025_db_user:q4R2D8cABkcl9vqQ@cluster0.hgqwufd.mongodb.net/gengig-backend'),
    UsersModule,
    MailModule,
    AuthModule,
  ],
})
export class AppModule {}