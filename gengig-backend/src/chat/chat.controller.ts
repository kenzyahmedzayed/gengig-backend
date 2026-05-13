import {Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, BadRequestException,} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsEnum(['teenlancer', 'agent'])
  userType!: 'teenlancer' | 'agent';
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private normalizeSendMessageDto(body: any, user: UserDocument) {
    const message = body.message ?? body.content ?? body.text ?? '';
    const sessionId = body.sessionId ?? body.conversationId ?? body.chatId;
    const userType = body.userType ?? user.role;

    if (!message || typeof message !== 'string') {
      throw new BadRequestException('Message is required');
    }

    if (!sessionId || typeof sessionId !== 'string') {
      throw new BadRequestException('sessionId is required');
    }

    if (userType !== 'teenlancer' && userType !== 'agent') {
      throw new BadRequestException('userType must be teenlancer or agent');
    }

    return {
      message,
      sessionId,
      userType,
    } as SendMessageDto;
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentUser() user: UserDocument,
    @Body() body: any,
  ) {
    const dto = this.normalizeSendMessageDto(body, user);

    return this.chatService.sendMessage(
      String(user._id),
      dto.sessionId,
      dto.message,
      dto.userType,
    );
  }

  @Get('sessions')
  getSessions(@CurrentUser() user: UserDocument) {
    return this.chatService.getSessions(String(user._id));
  }

  @Get('history/:sessionId')
  getHistory(
    @CurrentUser() user: UserDocument,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.getHistory(String(user._id), sessionId);
  }

  @Delete('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  deleteSession(
    @CurrentUser() user: UserDocument,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.deleteSession(String(user._id), sessionId);
  }
}
