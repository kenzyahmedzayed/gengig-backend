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

  // Get saved cards
  async getCards(userId: string): Promise<PaymentCardDocument[]> {
    return this.cardModel.find({ userId }).exec();
  }

  // Save a new card
  async saveCard(userId: string, dto: SaveCardDto): Promise<PaymentCardDocument> {
    const card = new this.cardModel({
      userId,
      ...dto,
    });
    return card.save();
  }

  // Delete a card
  async deleteCard(cardId: string, userId: string): Promise<any> {
    const card = await this.cardModel.findOne({ _id: cardId, userId });
    if (!card) throw new NotFoundException('Card not found');
    await this.cardModel.findByIdAndDelete(cardId);
    return { message: 'Card removed successfully' };
  }

  // Get transaction history
  async getTransactions(userId: string): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}