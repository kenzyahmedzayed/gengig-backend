import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { getAllowedCorsOrigins, isOriginAllowed } from '../common/cors';

const allowedCorsOrigins = getAllowedCorsOrigins();

@WebSocketGateway({
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isOriginAllowed(origin, allowedCorsOrigins)) {
        return callback(null, true);
      }
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  // Track multiple sockets per user (multi-tab/device).
  private connectedUsers = new Map<string, Set<string>>();

  constructor(private readonly messagingService: MessagingService) {}

  afterInit(server: Server) {
    console.log('WebSocket server initialized ✅');
    server.use((socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');
        void token;
        next();
      } catch {
        next(new Error('Authentication failed'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    if (!this.server) return;

    const userId =
      (client.data?.userId as string | undefined) ??
      this.findUserIdBySocket(client.id);

    if (!userId) return;

    const isNowOffline = this.removeUserConnection(userId, client.id);
    if (!isNowOffline) return;

    await this.notifyContacts(userId, 'user_offline');
  }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.server || !data?.userId) return;

    const userId = String(data.userId).trim();
    if (!userId) return;

    client.data.userId = userId;
    client.join(userId);

    const isFirstConnection = this.addUserConnection(userId, client.id);
    if (isFirstConnection) {
      await this.notifyContacts(userId, 'user_online');
    }

    client.emit('online_users', { users: this.getOnlineUsers() });
    console.log(`User ${userId} joined ✅`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.senderId || !data?.receiverId || !data?.content) return;

    const message = await this.messagingService.sendMessage(
      data.senderId,
      data.receiverId,
      data.content,
    );

    this.server.to(data.receiverId).emit('receive_message', {
      ...message,
      isMine: false,
    });

    this.server.to(data.receiverId).emit('new_notification', {
      type: 'new_message',
      title: 'New Message 💬',
      message: 'New message received',
    });

    client.emit('message_sent', {
      ...message,
      isMine: true,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(@MessageBody() data: { userId: string; otherUserId: string }) {
    if (!data?.userId || !data?.otherUserId) return;

    await this.messagingService.markAsRead(data.userId, data.otherUserId);
    this.server.to(data.otherUserId).emit('messages_read', {
      by: data.userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { senderId: string; receiverId: string }) {
    if (!data?.senderId || !data?.receiverId) return;

    this.server.to(data.receiverId).emit('user_typing', {
      userId: data.senderId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(@MessageBody() data: { senderId: string; receiverId: string }) {
    if (!data?.senderId || !data?.receiverId) return;

    this.server.to(data.receiverId).emit('user_stop_typing', {
      userId: data.senderId,
    });
  }

  emitToUser(userId: string, event: string, data: unknown) {
    if (!this.server) return;
    this.server.to(userId).emit(event, data);
  }

  private addUserConnection(userId: string, socketId: string): boolean {
    const existingSockets = this.connectedUsers.get(userId);
    if (existingSockets) {
      existingSockets.add(socketId);
      return false;
    }

    this.connectedUsers.set(userId, new Set([socketId]));
    return true;
  }

  private removeUserConnection(userId: string, socketId: string): boolean {
    const sockets = this.connectedUsers.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size > 0) {
      return false;
    }

    this.connectedUsers.delete(userId);
    return true;
  }

  private findUserIdBySocket(socketId: string): string | null {
    for (const [userId, sockets] of this.connectedUsers.entries()) {
      if (sockets.has(socketId)) {
        return userId;
      }
    }
    return null;
  }

  private getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  private async notifyContacts(
    userId: string,
    event: 'user_online' | 'user_offline',
  ): Promise<void> {
    try {
      const contacts = await this.messagingService.getContactIds(userId);
      contacts.forEach((contactId) => {
        this.server.to(contactId).emit(event, { userId });
      });
    } catch {
      // Best-effort notification.
    }
  }
}
