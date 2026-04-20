import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentCard, PaymentCardDocument, Transaction, TransactionDocument } from './payment.schema';
import { SaveCardDto } from './dto/save-card.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(PaymentCard.name)
    private readonly cardModel: Model<PaymentCardDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async getCards(userId: string): Promise<PaymentCardDocument[]> {
    return this.cardModel.find({ userId }).exec();
  }

  async saveCard(userId: string, dto: SaveCardDto): Promise<PaymentCardDocument> {
    const card = new this.cardModel({
      userId,
      ...dto,
    });
    return card.save();
  }

  async deleteCard(cardId: string, userId: string): Promise<any> {
    const card = await this.cardModel.findOne({ _id: cardId, userId });
    if (!card) throw new NotFoundException('Card not found');
    await this.cardModel.findByIdAndDelete(cardId);
    return { message: 'Card removed successfully' };
  }

  async getTransactions(userId: string): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }
  async withdraw(userId: string, amount: number): Promise<any> {
  const transaction = new this.transactionModel({
    userId,
    amount,
    type: 'withdrawal',
    description: 'Withdrawal request',
    status: 'pending',
  });
  await transaction.save();

  return {
    message: 'Withdrawal request submitted successfully',
    amount,
    status: 'pending',
  };
}
}