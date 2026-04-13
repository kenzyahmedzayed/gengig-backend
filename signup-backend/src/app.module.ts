import 'dotenv/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb+srv://gengig_db_user:gengig1004@cluster0.ijnyk5x.mongodb.net/gengig-backend?appName=Cluster0',
      }),
    }),
    UsersModule,
    MailModule,
    AuthModule,
    GigsModule,
    ApplicationsModule,
    ChatModule,
    CommunityModule,
    ReviewsModule,
    NotificationsModule,
    PaymentsModule,
    SupportModule,
  ],
})
export class AppModule {}
