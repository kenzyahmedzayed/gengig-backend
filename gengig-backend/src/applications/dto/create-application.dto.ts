import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @MinLength(20, { message: 'Cover letter must be at least 20 characters' })
  coverLetter!: string;

  @IsOptional()
  @IsString()
  portfolioLink?: string;
}