import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './message.schema';

@Injectable()
export class MessagingService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  // Get contacts list
  async getContacts(userId: string): Promise<any[]> {
    const messages = await this.messageModel
      .find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
      .populate('sender', 'name photo role')
      .populate('receiver', 'name photo role')
      .sort({ createdAt: -1 })
      .exec();

    // Get unique contacts
    const contactsMap = new Map();
    for (const msg of messages) {
      const other = String((msg.sender as any)._id) === userId
        ? msg.receiver
        : msg.sender;
      const otherId = String((other as any)._id);
      if (!contactsMap.has(otherId)) {
        contactsMap.set(otherId, {
          user: other,
          lastMessage: msg.content,
          lastMessageTime: (msg as any).createdAt,
          isRead: msg.isRead,
        });
      }
    }

    return Array.from(contactsMap.values());
  }

  // Get messages between two users
  async getMessages(userId: string, otherUserId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      })
      .populate('sender', 'name photo')
      .populate('receiver', 'name photo')
      .sort({ createdAt: 1 })
      .exec();
  }

  // Send a message
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<MessageDocument> {
    const message = new this.messageModel({
      sender: senderId,
      receiver: receiverId,
      content,
    });
    return message.save();
  }

  // Mark messages as read
  async markAsRead(userId: string, otherUserId: string): Promise<any> {
    await this.messageModel.updateMany(
      { sender: otherUserId, receiver: userId, isRead: false },
      { isRead: true },
    );
    return { message: 'Messages marked as read' };
  }
}