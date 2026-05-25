import { IsString, IsOptional } from 'class-validator';

export class SaveCardDto {
  @IsString()
  @IsOptional()
  cardHolderName?: string;

  @IsString()
  @IsOptional()
  nameOnCard?: string;

  @IsString()
  @IsOptional()
  lastFourDigits?: string;

  @IsString()
  @IsOptional()
  cardNumber?: string;

  @IsString()
  @IsOptional()
  expiryMonth?: string;

  @IsString()
  @IsOptional()
  expiryYear?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  cardType?: string;

  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  cvv?: string;
}