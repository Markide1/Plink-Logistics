import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import {
  RequestVerificationCodeDto,
  VerifyEmailDto,
} from './dto/email-verification.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user account',
    description: `
      Create a new user account in the Plink Logistics system. Upon successful registration,
      a welcome email will be sent to the provided email address.
      
      **Note**: Admin accounts cannot be created through this endpoint.
    `,
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      user: {
        summary: 'Standard user registration',
        value: {
          email: 'user@example.com',
          password: 'securePassword123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: 'uuid-string',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
          },
        },
        statusCode: 201,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or invalid data',
    schema: {
      example: {
        success: false,
        message: 'Password must be at least 6 characters long',
        errorCode: 'VALIDATION_FAILED',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiConflictResponse({
    description: 'User with this email already exists',
    schema: {
      example: {
        success: false,
        message: 'User with this email already exists',
        errorCode: 'USER_ALREADY_EXISTS',
        statusCode: 409,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    const validationResult = RegisterSchema.validate(registerDto) as {
      error?: { details: { message: string }[] };
      value: RegisterDto;
    };
    const { error, value } = validationResult;
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.authService.register(value);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and get access token',
    description: `
      Authenticate a user with email and password. Returns JWT access token for subsequent API calls.
      Supports both regular users and admin accounts.
      
      **Note**: Temporary passwords expire after 24 hours.
    `,
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      user: {
        summary: 'Regular user login',
        value: {
          email: 'user@example.com',
          password: 'userPassword123',
        },
      },
      admin: {
        summary: 'Admin login',
        value: {
          email: 'admin@example.com',
          password: 'adminPassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'uuid-string',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or expired temporary password',
    schema: {
      example: {
        success: false,
        message: 'Invalid credentials',
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        message: 'Please provide a valid email address',
        errorCode: 'VALIDATION_FAILED',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    const validationResult = LoginSchema.validate(loginDto) as {
      error?: { details: { message: string }[] };
      value: LoginDto;
    };
    const { error, value } = validationResult;
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.authService.login(value);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: `
      Retrieve the profile information of the currently authenticated user.
      Requires valid JWT token in Authorization header.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'User profile fetched successfully',
        data: {
          id: 'uuid-string',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          role: 'USER',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
        errorCode: 'AUTH_UNAUTHORIZED',
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: `
      Send a password reset code to the user's email address.
      The code expires after 15 minutes for security purposes.
      
      **Note**: This endpoint doesn't reveal if the email exists for security reasons.
    `,
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Email address for password reset',
    examples: {
      request: {
        summary: 'Password reset request',
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Password reset code sent (or email doesn't exist)",
    schema: {
      example: {
        success: true,
        message: 'Password reset code has been sent to your email address.',
        data: {
          message:
            'Check your email for the 6-digit reset code. The code will expire in 15 minutes.',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
    schema: {
      example: {
        success: false,
        message: 'Please provide a valid email address',
        errorCode: 'VALIDATION_EMAIL_INVALID',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const { error, value } = ForgotPasswordSchema.validate(
      forgotPasswordDto,
    ) as {
      error?: { details: { message: string }[] };
      value: ForgotPasswordDto;
    };
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    if (!value) {
      throw new BadRequestException('Invalid forgot password data.');
    }
    return this.authService.forgotPassword(value);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with code',
    description: `
      Reset a user's password using the 6-digit code sent to their email.
      The reset code expires after 15 minutes.
    `,
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Password reset data',
    examples: {
      reset: {
        summary: 'Password reset with code',
        value: {
          email: 'user@example.com',
          resetToken: '123456',
          newPassword: 'newSecurePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      example: {
        success: true,
        message:
          'Password has been reset successfully. You can now log in with your new password.',
        data: {
          message:
            'Password reset complete. Please log in with your new password.',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid reset code or expired token',
    schema: {
      example: {
        success: false,
        message: 'Reset code has expired. Please request a new one.',
        errorCode: 'AUTH_TOKEN_EXPIRED',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      example: {
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const validationResult = ResetPasswordSchema.validate(resetPasswordDto) as {
      error?: { details: { message: string }[] };
      value: ResetPasswordDto;
    };
    const { error, value } = validationResult;
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.authService.resetPassword(value);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change password for authenticated user',
    description: `
      Change the password for the currently authenticated user.
      Requires the current password for verification.
      
      **Note**: This will clear any temporary password if the user was created through the parcel request system.
    `,
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change data',
    examples: {
      change: {
        summary: 'Change password',
        value: {
          currentPassword: 'currentPassword123',
          newPassword: 'newSecurePassword123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password has been changed successfully.',
        data: {
          message: 'Your password has been updated successfully.',
        },
        statusCode: 200,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
        errorCode: 'AUTH_UNAUTHORIZED',
        statusCode: 401,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid current password or validation error',
    schema: {
      example: {
        success: false,
        message: 'Current password is incorrect',
        errorCode: 'USER_INVALID_CURRENT_PASSWORD',
        statusCode: 400,
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: { id: string },
  ) {
    const validationResult = ChangePasswordSchema.validate(
      changePasswordDto,
    ) as {
      error?: { details: { message: string }[] };
      value: ChangePasswordDto;
    };
    const { error, value } = validationResult;
    if (error) {
      throw new BadRequestException(error.details[0].message);
    }
    return this.authService.changePassword(user.id, value);
  }

  @Public()
  @Post('request-verification-code')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request email verification code' })
  @ApiResponse({ status: 201, description: 'Verification code sent.' })
  async requestVerificationCode(@Body() dto: RequestVerificationCodeDto) {
    await this.authService.sendVerificationCode(dto.email);
    return { success: true, message: 'Verification code sent.' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({ status: 200, description: 'Email verified.' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.email, dto.code);
    return { success: true, message: 'Email verified.' };
  }
}
