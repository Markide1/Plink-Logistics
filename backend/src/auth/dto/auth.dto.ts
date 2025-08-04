import * as Joi from 'joi';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// JOI validation schema for registration
export const RegisterSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(50).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password must not exceed 50 characters',
    'any.required': 'Password is required',
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name must not exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name must not exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  phone: Joi.string().optional().allow('', null),
});

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  password: string;
}

// JOI validation schema for login
export const LoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

// JOI validation schema for forgot password
export const ForgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'Reset token must be a string' })
  @Length(6, 6, { message: 'Reset token must be exactly 6 digits' })
  resetToken: string;

  @IsString({ message: 'New password must be a string' })
  newPassword: string;
}

// JOI validation schema for reset password
export const ResetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  resetToken: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'Reset token must be exactly 6 digits',
      'string.pattern.base': 'Reset token must contain only numbers',
      'any.required': 'Reset token is required',
    }),
  newPassword: Joi.string().min(6).max(50).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.max': 'New password must not exceed 50 characters',
    'any.required': 'New password is required',
  }),
});

export class ChangePasswordDto {
  @IsString({ message: 'Current password must be a string' })
  currentPassword: string;

  @IsString({ message: 'New password must be a string' })
  newPassword: string;
}

// JOI validation schema for change password
export const ChangePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).max(50).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.max': 'New password must not exceed 50 characters',
    'any.required': 'New password is required',
  }),
});

export class AuthResponseDto {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      phone: string;
      createdAt: string;
      updatedAt: string;
      profileImage?: string;
    };
    accessToken: string;
  };
  statusCode: number;
  timestamp: string;
}
