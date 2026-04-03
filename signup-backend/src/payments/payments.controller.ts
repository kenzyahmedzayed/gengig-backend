import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SaveCardDto } from './dto/save-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // GET /payments/cards
  @Get('cards')
  getCards(@CurrentUser() user: UserDocument) {
    return this.paymentsService.getCards(String(user._id));
  }

  // POST /payments/save-card
  @Post('save-card')
  @HttpCode(HttpStatus.CREATED)
  saveCard(
    @CurrentUser() user: UserDocument,
    @Body() dto: SaveCardDto,
  ) {
    return this.paymentsService.saveCard(String(user._id), dto);
  }

  // DELETE /payments/cards/:id
  @Delete('cards/:id')
  @HttpCode(HttpStatus.OK)
  deleteCard(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.paymentsService.deleteCard(id, String(user._id));
  }

  // GET /payments/transactions
  @Get('transactions')
  getTransactions(@CurrentUser() user: UserDocument) {
    return this.paymentsService.getTransactions(String(user._id));
  }
}