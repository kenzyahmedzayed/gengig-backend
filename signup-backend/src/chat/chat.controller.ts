import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsEnum(['teenlancer', 'agent'])
  userType: 'teenlancer' | 'agent';
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // POST /chat/send
  @Post('send')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentUser() user: UserDocument,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      String(user._id),
      dto.sessionId,
      dto.message,
      dto.userType,
    );
  }

  // GET /chat/sessions
  @Get('sessions')
  getSessions(@CurrentUser() user: UserDocument) {
    return this.chatService.getSessions(String(user._id));
  }

  // GET /chat/history/:sessionId
  @Get('history/:sessionId')
  getHistory(
    @CurrentUser() user: UserDocument,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.getHistory(String(user._id), sessionId);
  }

  // DELETE /chat/session/:sessionId
  @Delete('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  deleteSession(
    @CurrentUser() user: UserDocument,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.deleteSession(String(user._id), sessionId);
  }
}