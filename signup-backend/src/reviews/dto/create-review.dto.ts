import { IsString, IsNumber, IsMongoId, Min, Max, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  teenlancerId!: string;

  @IsMongoId()
  gigId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters' })
  comment!: string;
}