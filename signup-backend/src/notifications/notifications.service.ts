import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly chatGateway: ChatGateway,
  ) {}

async findAll(userId: string): Promise<any[]> {
    const notifications = await this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    return notifications.map(n => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead === true,
      link: n.link,
      createdAt: (n as any).createdAt,
    }));
}

async getUnreadCount(userId: string): Promise<any> {
    const count = await this.notificationModel.countDocuments({
      userId,
      isRead: false,
    });
    return { count };
}

async markAsRead(id: string, userId: string): Promise<any> {
    try {
      await this.notificationModel.findByIdAndUpdate(
        id,
        { $set: { isRead: true } },
        { returnDocument: 'after' }
      );
      return { success: true };
    } catch (err: any) {
      console.error('markAsRead error:', err.message);
      return { success: false };
    }
}

async markAllAsRead(userId: string): Promise<any> {
    await this.notificationModel.updateMany(
      { userId: userId, isRead: false },
      { $set: { isRead: true } }
    );
    return { message: 'All notifications marked as read', success: true };
}

async delete(id: string, userId: string): Promise<any> {
    const notification = await this.notificationModel.findOne({
      _id: id,
      userId,
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.notificationModel.findByIdAndDelete(id);
    return { message: 'Notification deleted successfully' };
}

async create(
    userId: string,
    title: string,
    message: string,
    type?: string,
    link?: string,
  ): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create({
      userId,
      title,
      message,
      type: type || 'general',
      link,
    });

    try {
      this.chatGateway.emitToUser(String(userId), 'new_notification', {
        _id: notification._id,
        title,
        message,
        type: type || 'general',
        isRead: false,
        createdAt: (notification as any).createdAt,
      });
    } catch (err) {
      console.error('Failed to emit notification:', err);
    }
    return notification;
}
}