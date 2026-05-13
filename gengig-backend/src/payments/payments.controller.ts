import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import type { UserDocument } from '../users/users.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /payments/initiate — start a payment
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  async initiatePayment(
    @CurrentUser() user: UserDocument,
    @Body() body: { amount: number },
  ) {
    return this.paymentsService.initiatePayment(
      String(user._id),
      body.amount,
      {
        name: user.name,
        email: user.email,
      },
    );
  }

  // POST /payments/callback — Paymob calls this after payment
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Body() data: any) {
    return this.paymentsService.handleCallback(data);
  }
}