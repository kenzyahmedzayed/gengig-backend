import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

class SupportTicketDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}

class NewsletterDto {
  @IsEmail()
  email!: string;
}

@Controller()
export class SupportController {
  @Post('support/ticket')
  @HttpCode(HttpStatus.OK)
  submitTicket(@Body() dto: SupportTicketDto) {
    return { message: 'Support ticket submitted successfully. We will get back to you soon!' };
  }

  @Post('newsletter/subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(@Body() dto: NewsletterDto) {
    return { message: 'Successfully subscribed to newsletter!' };
  }
}