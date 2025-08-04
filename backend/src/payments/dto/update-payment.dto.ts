import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
    required: false,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiProperty({
    description: 'Transaction reference from payment provider',
    example: 'MPX123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  transactionRef?: string;

  @ApiProperty({
    description: 'Additional payment metadata as JSON',
    example: { phoneNumber: '+254700000000', provider: 'Safaricom' },
    required: false,
  })
  @IsOptional()
  metadata?: any;
}
