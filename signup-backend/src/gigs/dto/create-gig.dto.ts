import { IsString, IsNumber, IsArray, IsOptional, IsEnum, MinLength, Min,} from 'class-validator';
import { GigStatus } from '../gig.schema';

export class CreateGigDto {
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  title: string;

  @IsString()
  @MinLength(20, { message: 'Description must be at least 20 characters' })
  description: string;

  @IsString()
  category: string;

  @IsNumber()
  @Min(1, { message: 'Budget must be at least 1' })
  budget: number;

  @IsString()
  duration: string;

  @IsOptional()
  @IsArray()
  skills?: string[];
}