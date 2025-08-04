import { Type } from 'class-transformer';
import * as Joi from 'joi';

import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateParcelRequestDto {
  @IsEmail({}, { message: 'Please provide a valid receiver email address' })
  receiverEmail: string;

  @IsString({ message: 'Receiver name must be a string' })
  receiverName: string;

  @IsOptional()
  @IsString({ message: 'Receiver phone must be a string' })
  receiverPhone?: string;

  @IsString({ message: 'Description must be a string' })
  description: string;

  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0.1, { message: 'Weight must be at least 0.1 kg' })
  @Max(1000, { message: 'Weight cannot exceed 1000 kg' })
  weight: number;

  @IsString({ message: 'Pickup location must be a string' })
  pickupLocation: string;

  @IsString({ message: 'Destination location must be a string' })
  destinationLocation: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Requested pickup date must be a valid ISO date string' },
  )
  requestedPickupDate?: string;

  @IsOptional()
  @IsString({ message: 'Special instructions must be a string' })
  specialInstructions?: string;
}

// JOI validation schema for creating parcel request
export const CreateParcelRequestSchema = Joi.object({
  receiverEmail: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid receiver email address',
    'any.required': 'Receiver email is required',
  }),
  receiverName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Receiver name must be at least 2 characters long',
    'string.max': 'Receiver name must not exceed 100 characters',
    'any.required': 'Receiver name is required',
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
  pickupLocation: Joi.string().min(3).required().messages({
    'string.min': 'Pickup location must be at least 3 characters long',
    'any.required': 'Pickup location is required',
  }),
  destinationLocation: Joi.string().min(3).required().messages({
    'string.min': 'Destination location must be at least 3 characters long',
    'any.required': 'Destination location is required',
  }),
  requestedPickupDate: Joi.date().min('now').optional().messages({
    'date.min': 'Requested pickup date cannot be in the past',
  }),
  specialInstructions: Joi.string()
    .max(1000)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Special instructions must not exceed 1000 characters',
    }),
});

export class UpdateParcelRequestStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}

// JOI validation schema for updating parcel request status
export const UpdateParcelRequestStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .required()
    .messages({
      'any.only': 'Status must be one of: PENDING, APPROVED, REJECTED',
      'any.required': 'Status is required',
    }),
  adminNotes: Joi.string().max(1000).optional().allow('', null).messages({
    'string.max': 'Admin notes must not exceed 1000 characters',
  }),
});

export class ParcelRequestQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  senderId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// JOI validation schema for parcel request query
export const ParcelRequestQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
  senderId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});

export class CreateParcelFromRequestDto {
  requestId: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

// JOI validation schema for creating parcel from request
export const CreateParcelFromRequestSchema = Joi.object({
  requestId: Joi.string().uuid().required().messages({
    'string.uuid': 'Request ID must be a valid UUID',
    'any.required': 'Request ID is required',
  }),
  pickupLatitude: Joi.number().min(-90).max(90).optional(),
  pickupLongitude: Joi.number().min(-180).max(180).optional(),
  destinationLatitude: Joi.number().min(-90).max(90).optional(),
  destinationLongitude: Joi.number().min(-180).max(180).optional(),
});

export class ParcelRequestResponseDto {
  id: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  receiverEmail: string;
  description: string;
  weight: number;
  pickupLocation: string;
  destinationLocation: string;
  requestedPickupDate?: Date;
  specialInstructions?: string;
  status: string;
  adminNotes?: string;
  createdParcels?: any[];
  createdAt: Date;
  updatedAt: Date;
}
