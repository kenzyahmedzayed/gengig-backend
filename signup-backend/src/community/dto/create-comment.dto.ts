import { IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(2, { message: 'Comment must be at least 2 characters' })
  content!: string;
}