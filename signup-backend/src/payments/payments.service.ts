import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { PaymentCard, PaymentCardDocument, Transaction, TransactionDocument } from './payment.schema';
import { User, UserDocument } from '../users/users.schema';

@Injectable()
export class PaymentsService {
  private readonly apiKey: string;
  private readonly integrationId: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(PaymentCard.name)
    private readonly cardModel: Model<PaymentCardDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    this.apiKey = this.configService.get<string>('PAYMOB_API_KEY') || '';
    this.integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID') || '';
  }

async saveCard(userId: string, dto: any): Promise<any> {
    const cardHolderName = dto.cardHolderName || dto.nameOnCard || dto.name || 'Card Holder';
    const cardNumber = dto.cardNumber || '';
    const lastFourDigits = dto.lastFourDigits ||
      (cardNumber ? cardNumber.replace(/\s/g, '').slice(-4) : '0000');

    let expiryMonth = dto.expiryMonth || '';
    let expiryYear = dto.expiryYear || '';

    if (dto.expiryDate && dto.expiryDate.includes('/')) {
      const parts = dto.expiryDate.split('/');
      expiryMonth = parts[0]?.trim() || '01';
      expiryYear = parts[1]?.trim() || '26';
    }

    if (!expiryMonth) expiryMonth = '01';
    if (!expiryYear) expiryYear = '26';

    const card = await this.cardModel.create({
      userId,
      cardHolderName,
      lastFourDigits,
      expiryMonth,
      expiryYear,
      cardType: dto.cardType || 'Visa',
      isDefault: dto.isDefault || false,
    });

    await this.userModel.findByIdAndUpdate(userId, {
      savedCard: {
        cardType: dto.cardType || 'Visa',
        name: cardHolderName,
        maskedNumber: `**** **** **** ${lastFourDigits}`,
        expiry: `${expiryMonth}/${expiryYear}`,
      }
    });

    return card;
}

async getCards(userId: string): Promise<any> {
    const cards = await this.cardModel.find({ userId }).exec();
    if (!cards || cards.length === 0) {
      const user = await this.userModel.findById(userId).select('savedCard').exec();
      if (user?.savedCard) {
        return [user.savedCard];
      }
      return [];
    }
    return cards;
}

async deleteCard(userId: string, cardId: string): Promise<any> {
    await this.cardModel.findOneAndDelete({ _id: cardId, userId });
    await this.userModel.findByIdAndUpdate(userId, { savedCard: null });
    return { success: true, message: 'Card removed' };
}

async deleteAllCards(userId: string): Promise<any> {
    await this.cardModel.deleteMany({ userId });
    await this.userModel.findByIdAndUpdate(userId, { savedCard: null });
    return { success: true, message: 'Cards removed' };
}

async getTransactions(userId: string): Promise<any[]> {
    const transactions = await this.transactionModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
    return transactions || [];
}

async withdraw(userId: string, amount: number): Promise<any> {
    const transaction = await this.transactionModel.create({
      userId,
      amount,
      type: 'withdrawal',
      description: 'Withdrawal request',
      status: 'pending',
    });
    return {
      message: 'Withdrawal request submitted successfully',
      amount,
      status: 'pending',
      transaction,
    };
}

async getAuthToken(): Promise<string> {
    const response = await axios.post(
      'https://accept.paymob.com/api/auth/tokens',
      { api_key: this.apiKey }
    );
    return response.data.token;
}

async createOrder(authToken: string, amountCents: number): Promise<number> {
    const response = await axios.post(
      'https://accept.paymob.com/api/ecommerce/orders',
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        items: [],
      }
    );
    return response.data.id;
}

async getPaymentKey(
    authToken: string,
    orderId: number,
    amountCents: number,
    billingData: any,
  ): Promise<string> {
    const response = await axios.post(
      'https://accept.paymob.com/api/acceptance/payment_keys',
      {
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: parseInt(this.integrationId),
      }
    );
    return response.data.token;
}

async initiatePayment(userId: string, amountEGP: number, userInfo: any): Promise<any> {
    const amountCents = amountEGP * 100;
    const billingData = {
      apartment: 'NA', email: userInfo.email || 'test@test.com',
      floor: 'NA', first_name: userInfo.name?.split(' ')[0] || 'Test',
      last_name: userInfo.name?.split(' ')[1] || 'User',
      street: 'NA', building: 'NA', phone_number: '+201000000000',
      shipping_method: 'NA', postal_code: 'NA',
      city: 'Cairo', country: 'EG', state: 'Cairo',
    };
    const authToken = await this.getAuthToken();
    const orderId = await this.createOrder(authToken, amountCents);
    const paymentKey = await this.getPaymentKey(authToken, orderId, amountCents, billingData);
    const iframeId = this.configService.get<string>('PAYMOB_IFRAME_ID');
    return {
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`,
      paymentKey,
      orderId,
    };
}

async initiatePremiumPayment(
    userId: string,
    amountEGP: number,
    billingCycle: string,
    planName: string,
    userInfo: any,
  ): Promise<any> {
    const result = await this.initiatePayment(userId, amountEGP, userInfo);
    return {
      ...result,
      billingCycle,
      planName,
    };
}

async handlePremiumCallback(data: any): Promise<any> {
    try {
      const success = data?.obj?.success || data?.success;
      const userId = data?.obj?.order?.merchant_order_id || data?.userId;

      if (success && userId) {
        const billingCycle = data?.billingCycle || 'monthly';
        const premiumUntil = billingCycle === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await this.userModel.findByIdAndUpdate(userId, {
          isPremium: true,
          premiumUntil,
          premiumPlan: billingCycle,
        });
      }
    } catch (err) {
      console.error('Premium callback error:', err);
    }
    return { received: true };
}

async handleCallback(data: any): Promise<any> {
    const success = data?.obj?.success;
    const orderId = data?.obj?.order?.id;
    console.log(`Payment ${success ? 'SUCCESS' : 'FAILED'} for order ${orderId}`);
    return { received: true };
}
}