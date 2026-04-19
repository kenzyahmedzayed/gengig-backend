import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
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
  constructor(private readonly messagingService: MessagingService) {}

  // GET /chat/contacts
  @Get('contacts')
  getContacts(@CurrentUser() user: UserDocument) {
    return this.messagingService.getContacts(String(user._id));
  }

  // GET /chat/messages/:userId
  @Get('messages/:userId')
  getMessages(
    @CurrentUser() user: UserDocument,
    @Param('userId') otherUserId: string,
  ) {
    return this.messagingService.getMessages(String(user._id), otherUserId);
  }

  // POST /chat/messages/:userId
  @Post('messages/:userId')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @CurrentUser() user: UserDocument,
    @Param('userId') receiverId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(
      String(user._id),
      receiverId,
      dto.content,
    );
  }

  // PUT /chat/messages/:userId/read
  @Put('messages/:userId/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @CurrentUser() user: UserDocument,
    @Param('userId') otherUserId: string,
  ) {
    return this.messagingService.markAsRead(String(user._id), otherUserId);
  }
  // POST /chat/conversations
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
// GET /chat/unread-counts
@Get('unread-counts')
getUnreadCounts(@CurrentUser() user: UserDocument) {
  return this.messagingService.getUnreadCounts(String(user._id));
}
}