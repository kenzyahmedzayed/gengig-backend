import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [SupportController, UploadsController],
})
export class SupportModule {}