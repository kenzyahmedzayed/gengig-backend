import { Controller, Post, Get, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import type { UserDocument } from '../users/users.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

@Get('cards')
  getCards(@CurrentUser() user: UserDocument) {
    return this.paymentsService.getCards(String(user._id));
}

@Post('save-card')
@HttpCode(HttpStatus.OK)
  saveCard(
    @CurrentUser() user: UserDocument,
    @Body() dto: any,
  ) {
    return this.paymentsService.saveCard(String(user._id), dto);
}

@Delete('cards/:id')
@HttpCode(HttpStatus.OK)
  deleteCard(
    @CurrentUser() user: UserDocument,
    @Param('id') cardId: string,
  ) {
    return this.paymentsService.deleteCard(String(user._id), cardId);
}

@Delete('cards')
@HttpCode(HttpStatus.OK)
  deleteAllCards(@CurrentUser() user: UserDocument) {
    return this.paymentsService.deleteAllCards(String(user._id));
}

@Get('transactions')
  getTransactions(@CurrentUser() user: UserDocument) {
    return this.paymentsService.getTransactions(String(user._id));
}

@Post('withdraw')
@HttpCode(HttpStatus.OK)
  withdraw(
    @CurrentUser() user: UserDocument,
    @Body() body: { amount: number },
  ) {
    return this.paymentsService.withdraw(String(user._id), body.amount);
}

@Post('initiate')
@HttpCode(HttpStatus.OK)
  async initiatePayment(
    @CurrentUser() user: UserDocument,
    @Body() body: { amount: number },
  ) {
    return this.paymentsService.initiatePayment(
      String(user._id),
      body.amount,
      { name: user.name, email: user.email },
    );
}

@Post('premium/initiate')
@HttpCode(HttpStatus.OK)
  async initiatePremium(
    @CurrentUser() user: UserDocument,
    @Body() body: { amount: number; billingCycle: string; planName: string },
  ) {
    return this.paymentsService.initiatePremiumPayment(
      String(user._id),
      body.amount,
      body.billingCycle,
      body.planName,
      { name: user.name, email: user.email },
    );
}

@Post('premium/webhook')
@HttpCode(HttpStatus.OK)
  async premiumWebhook(@Body() data: any) {
    return this.paymentsService.handlePremiumCallback(data);
}

@Post('callback')
@HttpCode(HttpStatus.OK)
  async handleCallback(@Body() data: any) {
    return this.paymentsService.handleCallback(data);
}
}