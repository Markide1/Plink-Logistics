import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The parcel ID for this payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  parcelId: string;

  @ApiProperty({
    description: 'Payment amount in Kenyan Shillings',
    example: 500.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'KES',
    default: 'KES',
  })
  @IsString()
  @IsOptional()
  currency?: string = 'KES';

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.MPESA,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    default: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus = PaymentStatus.PENDING;

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
