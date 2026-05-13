import { Controller, Get, Post, Put, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';
import { IsString, IsNotEmpty } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly chatGateway: ChatGateway,
  ) {}

@Get('contacts')
async getContacts(@CurrentUser() user: UserDocument) {
    const userId = String(user._id);
    console.log('getContacts called with userId:', userId);
    if (!userId || userId === 'undefined' || userId === '') {
      return [];
    }
    return this.messagingService.getContacts(userId);
}

@Get('messages/:userId')
  getMessages(
    @CurrentUser() user: UserDocument,
    @Param('userId') otherUserId: string,
  ) {
    return this.messagingService.getMessages(String(user._id), otherUserId);
}

@Post('messages/:userId')
@HttpCode(HttpStatus.CREATED)
async sendMessage(
  @CurrentUser() user: UserDocument,
  @Param('userId') receiverId: string,
  @Body() dto: SendMessageDto,
) {
  const message = await this.messagingService.sendMessage(
    String(user._id),
    receiverId,
    dto.content,
  );
  this.chatGateway.emitToUser(receiverId, 'receive_message', {
    ...message,
    isMine: false,
  });
  this.chatGateway.emitToUser(receiverId, 'new_notification', {
    type: 'new_message',
    title: 'New Message 💬',
    message: `${user.name} sent you a message`,
    from: user.name,
    photo: user.photo || '',
  });
  return message;
}
  
@Put('messages/:userId/read')
@HttpCode(HttpStatus.OK)
  markAsRead(
    @CurrentUser() user: UserDocument,
    @Param('userId') otherUserId: string,
  ) {
    return this.messagingService.markAsRead(String(user._id), otherUserId);
}

@Post('conversations')
@HttpCode(HttpStatus.OK)
  async createConversation(
    @CurrentUser() user: UserDocument,
    @Body() body: any,
  ) {
    return this.messagingService.createConversation(
      String(user._id),
      body.userId,
    );
}

@Get('unread-counts')
  getUnreadCounts(@CurrentUser() user: UserDocument) {
    return this.messagingService.getUnreadCounts(String(user._id));
}
}