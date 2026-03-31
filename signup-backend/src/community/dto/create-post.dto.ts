import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(5, { message: 'Post content must be at least 5 characters' })
  content: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}