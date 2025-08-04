import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ReviewResponseDto {
  @ApiProperty({
    description: 'Review ID',
    example: 'cuid-example-123',
  })
  id: string;

  @ApiProperty({
    description: 'Review content/message',
    example: 'Great service! Fast delivery and excellent communication.',
  })
  content: string;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
  })
  rating: number;

  @ApiProperty({
    description: 'Review creation date',
    example: '2024-01-01T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Review last update date',
    example: '2024-01-01T12:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User who created the review',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Parcel associated with the review',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'parcel-id-example-123' },
      trackingNumber: { type: 'string', example: 'PCL-R4ULG' },
      description: { type: 'string', example: 'Electronics' },
      status: { type: 'string', example: 'DELIVERED' },
    },
  })
  parcel: {
    id: string;
    trackingNumber: string;
    description: string;
    status: string;
  };
}
