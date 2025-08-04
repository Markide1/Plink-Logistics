import { ApiProperty } from '@nestjs/swagger';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '+254712345678', required: false })
  phone?: string;

  @ApiProperty({ example: 'General Inquiry' })
  subject: string;

  @ApiProperty({ example: 'I have a question about my parcel.' })
  message: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  userId?: string;
}

export class ReplyContactMessageDto {
  @ApiProperty({
    example: 'Thank you for reaching out. We have resolved your issue.',
  })
  reply: string;
}
