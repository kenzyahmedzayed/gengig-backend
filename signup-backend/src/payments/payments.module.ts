import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentCard, PaymentCardSchema, Transaction, TransactionSchema } from './payment.schema';
import { User, UserSchema } from '../users/users.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: PaymentCard.name, schema: PaymentCardSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}