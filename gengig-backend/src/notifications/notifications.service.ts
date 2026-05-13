import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async findAll(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUnreadCount(userId: string): Promise<any> {
    const count = await this.notificationModel.countDocuments({
      userId,
      isRead: false,
    });
    return { count };
  }

  async markAsRead(id: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOne({
      _id: id,
      userId,
    });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.isRead = true;
    return notification.save();
  }

  async markAllAsRead(userId: string): Promise<any> {
    await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
    return { message: 'All notifications marked as read' };
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
    return this.notificationModel.create({
      userId,
      title,
      message,
      type,
      link,
    });
  }
}