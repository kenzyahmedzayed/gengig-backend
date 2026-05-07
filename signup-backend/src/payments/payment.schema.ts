import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentCardDocument = PaymentCard & Document;
export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class PaymentCard {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: '' })
  cardHolderName!: string;

  @Prop({ default: '' })
  lastFourDigits!: string;

  @Prop({ default: '' })
  expiryMonth!: string;

  @Prop({ default: '' })
  expiryYear!: string;

  @Prop({ default: 'Visa' })
  cardType!: string;

  @Prop({ default: false })
  isDefault!: boolean;
}

export const PaymentCardSchema = SchemaFactory.createForClass(PaymentCard);

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: 'completed' })
  status!: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);