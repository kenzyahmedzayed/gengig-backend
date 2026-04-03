import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SaveCardDto {
  @IsString()
  @IsNotEmpty()
  cardHolderName: string;

  @IsString()
  @IsNotEmpty()
  lastFourDigits: string;

  @IsString()
  @IsNotEmpty()
  expiryMonth: string;

  @IsString()
  @IsNotEmpty()
  expiryYear: string;

  @IsString()
  @IsNotEmpty()
  cardType: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}