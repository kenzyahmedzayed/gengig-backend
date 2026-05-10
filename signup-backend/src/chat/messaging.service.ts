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

  async getContacts(userId: string): Promise<any[]> {
  try {
    if (!userId || userId === '' || userId === 'undefined') {
      return [];
    }

    // Only get messages with valid sender and receiver
    const messages = await this.messageModel
      .find({
        $or: [{ sender: userId }, { receiver: userId }],
        sender: { $exists: true, $ne: null, $nin: ['', null] },
        receiver: { $exists: true, $ne: null, $nin: ['', null] },
      })
      .populate('sender', 'name photo role _id')
      .populate('receiver', 'name photo role _id')
      .sort({ createdAt: -1 })
      .exec();

    const contactsMap = new Map();

    for (const msg of messages) {
      try {
        const sender = msg.sender as any;
        const receiver = msg.receiver as any;

        if (!sender?._id || !receiver?._id) continue;

        const senderStr = String(sender._id);
        const receiverStr = String(receiver._id);

        if (!senderStr || senderStr === '' || !receiverStr || receiverStr === '') continue;

        const other = senderStr === userId ? receiver : sender;
        const otherId = String(other._id);

        if (!otherId || otherId === '' || otherId === 'undefined' || otherId === userId) continue;

        if (!contactsMap.has(otherId)) {
          const unreadCount = await this.messageModel.countDocuments({
            sender: otherId,
            receiver: userId,
            isRead: false,
          });

          contactsMap.set(otherId, {
            id: otherId,
            name: other.name || 'Unknown',
            photo: other.photo || '',
            role: other.role || '',
            lastMessage: msg.content,
            lastMessageTime: (msg as any).createdAt,
            unreadCount,
          });
        }
      } catch (msgErr: any) {
        continue;
      }
    }

    return Array.from(contactsMap.values());
  } catch (err: any) {
    console.error('getContacts error:', err.message);
    return [];
  }
}
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

  async sendMessage(
  senderId: string,
  receiverId: string,
  content: string,
): Promise<any> {
  const message = new this.messageModel({
    sender: senderId,
    receiver: receiverId,
    content,
    isDelivered: true,
    isRead: false,
  });
  const saved = await message.save();

  const populated = await this.messageModel
    .findById(saved._id)
    .populate('sender', 'name photo _id')
    .populate('receiver', 'name photo _id')
    .exec();

  return {
    _id: populated?._id,
    content: populated?.content,
    sender: populated?.sender,
    receiver: populated?.receiver,
    isRead: false,
    isDelivered: true,
    createdAt: (populated as any)?.createdAt,
  };
}

async markAsRead(userId: string, otherUserId: string): Promise<any> {
  await this.messageModel.updateMany(
    { sender: otherUserId, receiver: userId, isRead: false },
    { isRead: true, isDelivered: true },
  );
  return { message: 'Messages marked as read' };
}

  
  async createConversation(userId: string, otherUserId: string): Promise<any> {
  const existing = await this.messageModel.findOne({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
  })
  .populate('sender', 'name photo')
  .populate('receiver', 'name photo')
  .exec();

  if (existing) {
    const contact = String((existing.sender as any)._id) === userId
      ? existing.receiver
      : existing.sender;

    return {
      conversationId: `conv_${userId}_${otherUserId}`,
      contact: {
        id: String((contact as any)._id),
        name: (contact as any).name,
        photo: (contact as any).photo || '',
      },
    };
  }

  return {
    conversationId: `conv_${userId}_${otherUserId}`,
    contact: {
      id: otherUserId,
    },
  };
}
async getUnreadCounts(userId: string): Promise<any> {
  const unreadMessages = await this.messageModel.aggregate([
    {
      $match: {
        receiver: userId,
        isRead: false,
      },
    },
    {
      $group: {
        _id: '$sender',
        count: { $sum: 1 },
      },
    },
  ]);

  const totalUnread = unreadMessages.reduce((sum, item) => sum + item.count, 0);

  return {
    total: totalUnread,
    byContact: unreadMessages.map(item => ({
      userId: item._id,
      count: item.count,
    })),
  };
}
}