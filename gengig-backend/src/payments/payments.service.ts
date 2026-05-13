import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

@Injectable()
export class PaymentsService {
  private readonly apiKey: string;
  private readonly integrationId: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('PAYMOB_API_KEY') || '';
    this.integrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID') || '';
  }

  // Step A: Get Auth Token
  async getAuthToken(): Promise<string> {
    const response = await axios.post(
      'https://accept.paymob.com/api/auth/tokens',
      { api_key: this.apiKey }
    );
    return response.data.token;
  }

  // Step B: Create Order
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

  // Step C: Get Payment Key
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

  // Full payment flow — returns iframe URL
  async initiatePayment(userId: string, amountEGP: number, userInfo: any): Promise<any> {
    const amountCents = amountEGP * 100;

    const billingData = {
      apartment: 'NA',
      email: userInfo.email || 'test@test.com',
      floor: 'NA',
      first_name: userInfo.name?.split(' ')[0] || 'Test',
      last_name: userInfo.name?.split(' ')[1] || 'User',
      street: 'NA',
      building: 'NA',
      phone_number: userInfo.phone || '+201000000000',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'Cairo',
      country: 'EG',
      state: 'Cairo',
    };

    // Step A
    const authToken = await this.getAuthToken();

    // Step B
    const orderId = await this.createOrder(authToken, amountCents);

    // Step C
    const paymentKey = await this.getPaymentKey(
      authToken,
      orderId,
      amountCents,
      billingData,
    );

    const iframeId = this.configService.get<string>('PAYMOB_IFRAME_ID');
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

    return {
      iframeUrl,
      paymentKey,
      orderId,
    };
  }

  // Callback from Paymob after payment
  async handleCallback(data: any): Promise<any> {
    const transactionData = data.obj;
    const success = transactionData?.success;
    const orderId = transactionData?.order?.id;
    const amount = transactionData?.amount_cents / 100;

    console.log(`Payment ${success ? 'SUCCESS' : 'FAILED'} for order ${orderId}, amount: ${amount} EGP`);

    return { received: true };
  }
}