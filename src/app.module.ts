import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { GigsModule } from './gigs/gigs.module';
import { ApplicationsModule } from './applications/applications.module';
import { ChatModule } from './chat/chat.module';
import { CommunityModule } from './community/community.module';
import { ReviewsModule } from './reviews/review.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { SupportModule } from './support/support.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGO_URI_DIRECT') ||
          configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error('MONGO_URI is required');
        }

        return {
          uri,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, 
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100, 
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000, 
      },
    ]),
    UsersModule, MailModule, AuthModule, GigsModule, ApplicationsModule, ChatModule, CommunityModule, ReviewsModule, NotificationsModule, PaymentsModule, SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
