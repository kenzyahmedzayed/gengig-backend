import { IsString, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateGigDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsString()
  category!: string;

  @IsString()
  budget!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsArray()
  requirements?: string[];
}