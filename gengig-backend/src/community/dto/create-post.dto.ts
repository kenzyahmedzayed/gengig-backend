import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    return value;
  })
  tags?: string[];
}
