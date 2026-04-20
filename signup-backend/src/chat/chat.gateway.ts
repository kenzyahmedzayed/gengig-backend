import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private readonly messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
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
    this.connectedUsers.set(data.userId, client.id);
    client.join(data.userId);
    this.server.emit('user_online', { userId: data.userId });
    console.log(`User ${data.userId} joined`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.messagingService.sendMessage(
      data.senderId,
      data.receiverId,
      data.content,
    );

    this.server.to(data.receiverId).emit('receive_message', message);

    client.emit('message_sent', message);
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { userId: string; otherUserId: string },
  ) {
    await this.messagingService.markAsRead(data.userId, data.otherUserId);
    this.server.to(data.otherUserId).emit('messages_read', {
      by: data.userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    this.server.to(data.receiverId).emit('user_typing', {
      userId: data.senderId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    this.server.to(data.receiverId).emit('user_stop_typing', {
      userId: data.senderId,
    });
  }
}