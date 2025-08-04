import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Review content/message',
    example: 'Updated review: Excellent service and fast delivery!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Review content must not exceed 1000 characters' })
  content?: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating?: number;
}
