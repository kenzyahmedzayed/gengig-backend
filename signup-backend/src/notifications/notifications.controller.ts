import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications
  @Get()
  findAll(@CurrentUser() user: UserDocument) {
    return this.notificationsService.findAll(String(user._id));
  }

  // GET /notifications/unread-count
  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: UserDocument) {
    return this.notificationsService.getUnreadCount(String(user._id));
  }

  // PUT /notifications/read-all
  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@CurrentUser() user: UserDocument) {
    return this.notificationsService.markAllAsRead(String(user._id));
  }

  // PUT /notifications/:id/read
  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.notificationsService.markAsRead(id, String(user._id));
  }

  // DELETE /notifications/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.notificationsService.delete(id, String(user._id));
  }
}