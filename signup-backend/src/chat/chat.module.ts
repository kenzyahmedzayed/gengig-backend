import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChatMessage, ChatMessageSchema } from './chat.schema';
import { Message, MessageSchema } from './message.schema';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  providers: [ChatService, MessagingService, ChatGateway],
  controllers: [ChatController, MessagingController],
  exports: [ChatGateway],
})
export class ChatModule {}