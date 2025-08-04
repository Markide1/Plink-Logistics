import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Review content/message',
    example: 'Great service! Fast delivery and excellent communication.',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  content: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;

  @ApiProperty({
    description: 'ID of the parcel being reviewed',
    example: 'CU12345',
  })
  @IsString({ message: 'Parcel ID must be a string' })
  parcelId: string;
}
