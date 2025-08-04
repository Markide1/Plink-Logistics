import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as Joi from 'joi';
import { IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateParcelDto {
  @IsEmail({}, { message: 'Please provide a valid receiver email address' })
  receiverEmail: string;

  @IsOptional()
  @IsString({ message: 'Parcel request ID must be a string' })
  parcelRequestId?: string;

  @IsString({ message: 'Receiver name must be a string' })
  @MinLength(2, { message: 'Receiver name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Receiver name must not exceed 100 characters' })
  @IsOptional()
  receiverName?: string;

  @IsString({ message: 'Receiver phone must be a string' })
  @Matches(/^[+]?[0-9\s\-()]{8,15}$/, {
    message: 'Please provide a valid phone number',
  })
  @IsOptional()
  receiverPhone?: string;

  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0.1, { message: 'Weight must be at least 0.1 kg' })
  @Max(1000, { message: 'Weight cannot exceed 1000 kg' })
  weight: number;

  @IsString({ message: 'Pickup location must be a string' })
  pickupLocation: string;

  @IsOptional()
  @IsNumber({}, { message: 'Pickup latitude must be a number' })
  pickupLatitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Pickup longitude must be a number' })
  pickupLongitude?: number;

  @IsString({ message: 'Destination location must be a string' })
  destinationLocation: string;

  @IsOptional()
  @IsNumber({}, { message: 'Destination latitude must be a number' })
  destinationLatitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Destination longitude must be a number' })
  destinationLongitude?: number;
}

// JOI validation schema for creating parcel
export const CreateParcelSchema = Joi.object({
  receiverEmail: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid receiver email address',
    'any.required': 'Receiver email is required',
  }),
  receiverName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Receiver name must be at least 2 characters long',
    'string.max': 'Receiver name must not exceed 100 characters',
  }),
  receiverPhone: Joi.string()
    .pattern(/^[+]?[0-9\s\-()]{8,15}$/)
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
  description: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Description must be at least 5 characters long',
    'string.max': 'Description must not exceed 500 characters',
    'any.required': 'Description is required',
  }),
  weight: Joi.number().min(0.1).max(1000).required().messages({
    'number.min': 'Weight must be at least 0.1 kg',
    'number.max': 'Weight cannot exceed 1000 kg',
    'any.required': 'Weight is required',
  }),
  pickupLocation: Joi.string().required().messages({
    'any.required': 'Pickup location is required',
  }),
  pickupLatitude: Joi.number().min(-90).max(90).optional(),
  pickupLongitude: Joi.number().min(-180).max(180).optional(),
  destinationLocation: Joi.string().required().messages({
    'any.required': 'Destination location is required',
  }),
  destinationLatitude: Joi.number().min(-90).max(90).optional(),
  destinationLongitude: Joi.number().min(-180).max(180).optional(),
  parcelRequestId: Joi.string().uuid().optional(),
});

export class UpdateParcelStatusDto {
  status: string;
  currentLocation?: string;
}

// JOI validation schema for updating parcel status and location
export const UpdateParcelStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'PENDING',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'RECEIVED',
      'CANCELLED',
    )
    .required()
    .messages({
      'any.only':
        'Invalid parcel status. Valid statuses are: PENDING, PICKED_UP, IN_TRANSIT, DELIVERED, RECEIVED, CANCELLED',
      'any.required': 'Status is required',
    }),
  currentLocation: Joi.string().optional().allow('', null),
});

export class BulkUpdateParcelStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  parcelIds: string[];

  @IsString()
  status: string;
}

export const BulkUpdateParcelStatusSchema = Joi.object({
  parcelIds: Joi.array().items(Joi.string().required()).min(1).required(),
  status: Joi.string()
    .valid(
      'PENDING',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'RECEIVED',
      'CANCELLED',
    )
    .required(),
});

export class ParcelQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @IsString()
  receiverId?: string;

  // Add receiverEmail for filtering by email
  @IsOptional()
  @IsString()
  receiverEmail?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value) || 1)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value) || 10)
  @IsNumber()
  limit?: number;
}

export class ParcelResponseDto {
  id: string;
  trackingNumber: string;
  description: string;
  weight: number;
  price: number;
  status: string;
  pickupLocation: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLocation: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
