import { IsString, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export class TeenlancerOnboardingDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsString()
  availability?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}