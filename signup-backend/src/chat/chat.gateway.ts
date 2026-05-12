import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', '*'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private readonly messagingService: MessagingService) {}

afterInit(server: Server) {
    console.log('WebSocket server initialized ✅');
    server.use((socket: any, next) => {
      try {
        const token = socket.handshake.auth?.token ||
                      socket.handshake.headers?.authorization?.replace('Bearer ', '');
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });
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
      // Notify contacts
      this.messagingService.getContactIds(userId).then(contacts => {
        contacts.forEach(contactId => {
          this.server.to(contactId).emit('user_offline', { userId });
        });
      }).catch(() => {});
      break;
    }
  }
}

@SubscribeMessage('join')
async handleJoin(
  @MessageBody() data: { userId: string },
  @ConnectedSocket() client: Socket,
) {
  if (!data?.userId || !this.server) return;
  this.connectedUsers.set(data.userId, client.id);
  client.join(data.userId);
  try {
    const contacts = await this.messagingService.getContactIds(data.userId);
    contacts.forEach(contactId => {
      this.server.to(contactId).emit('user_online', { userId: data.userId });
    });
  } catch (err) {

  }
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
  this.server.to(data.receiverId).emit('receive_message', {
    ...message,
    isMine: false,
  });
  this.server.to(data.receiverId).emit('new_notification', {
    type: 'new_message',
    title: 'New Message 💬',
    message: `New message received`,
  });
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

emitToUser(userId: string, event: string, data: any) {
    if (!this.server) return;
    this.server.to(userId).emit(event, data);
}
}