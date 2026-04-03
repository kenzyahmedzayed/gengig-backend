import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentCard, PaymentCardSchema, Transaction, TransactionSchema } from './payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentCard.name, schema: PaymentCardSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}