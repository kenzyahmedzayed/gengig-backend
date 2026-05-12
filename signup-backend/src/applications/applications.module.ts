import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application, ApplicationSchema } from './application.schema';
import { Gig, GigSchema } from '../gigs/gig.schema';
import { Notification, NotificationSchema } from '../notifications/notification.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Gig.name, schema: GigSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}