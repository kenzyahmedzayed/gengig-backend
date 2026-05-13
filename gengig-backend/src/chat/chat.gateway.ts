import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: false,
  },
  transports: ['websocket', 'polling'],
  namespace: '/',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private readonly messagingService: MessagingService) {}

  afterInit(server: Server) {
    console.log('WebSocket server initialized ✅');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    if (!this.server) return;
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        this.server.emit('user_offline', { userId });
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.userId || !this.server) return;
    this.connectedUsers.set(data.userId, client.id);
    client.join(data.userId);
    this.server.emit('user_online', { userId: data.userId });
    const onlineUsers = Array.from(this.connectedUsers.keys());
    client.emit('online_users', { users: onlineUsers });
    console.log(`User ${data.userId} joined ✅`);
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

    // Send to receiver
    this.server.to(data.receiverId).emit('receive_message', {
      ...message,
      isMine: false,
    });

    // Confirm to sender
    client.emit('message_sent', {
      ...message,
      isMine: true,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { userId: string; otherUserId: string },
  ) {
    if (!data?.userId || !data?.otherUserId) return;
    await this.messagingService.markAsRead(data.userId, data.otherUserId);
    this.server.to(data.otherUserId).emit('messages_read', {
      by: data.userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    if (!data?.senderId || !data?.receiverId) return;
    this.server.to(data.receiverId).emit('user_typing', {
      userId: data.senderId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    if (!data?.senderId || !data?.receiverId) return;
    this.server.to(data.receiverId).emit('user_stop_typing', {
      userId: data.senderId,
    });
  }

  // Method to emit from other services
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(userId).emit(event, data);
  }
}