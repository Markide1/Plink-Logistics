/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CommonHelpers } from '../common/helpers';
import { RESPONSE_MESSAGES } from '../common/constants';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser && !existingUser.isDeleted) {
      throw new ConflictException(RESPONSE_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await CommonHelpers.hashPassword(password);

    try {
      // Create user
      const verificationCode = String(randomInt(100000, 999999));
      const verificationCodeExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      const user = await this.prismaService.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          emailVerified: false,
          verificationCode,
          verificationCodeExpiry,
        },
      });

      // Send welcome email with code
      await this.emailService.sendWelcomeEmail(
        email,
        firstName,
        lastName,
        verificationCode,
      );

      // Generate JWT token
      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      return CommonHelpers.createResponse(
        true,
        RESPONSE_MESSAGES.REGISTER_SUCCESS,
        {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
        },
        201,
      );
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.tempPassword && user.tempPasswordExpiry) {
      const isTempPasswordValid = await CommonHelpers.comparePasswords(
        password,
        user.tempPassword,
      );
      if (isTempPasswordValid) {
        if (new Date() > user.tempPasswordExpiry) {
          throw new UnauthorizedException(
            'Temporary password has expired, change it using forgot password.',
          );
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        return CommonHelpers.createResponse(
          true,
          RESPONSE_MESSAGES.LOGIN_SUCCESS,
          {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            },
            accessToken,
          },
        );
      }
    }

    // If not using temp password, verify main password
    const isPasswordValid = await CommonHelpers.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    // Fix: Clear tempPassword and tempPasswordExpiry if user logs in with new password
    if (user.tempPassword || user.tempPasswordExpiry) {
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          tempPassword: null,
          tempPasswordExpiry: null,
        },
      });
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return CommonHelpers.createResponse(true, RESPONSE_MESSAGES.LOGIN_SUCCESS, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
    });
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || user.isDeleted) {
      return null;
    }

    const isPasswordValid = await CommonHelpers.comparePasswords(
      pass,
      user.password,
    );

    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    return CommonHelpers.createResponse(true, RESPONSE_MESSAGES.USER_FETCHED, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || user.isDeleted) {
      // Don't reveal if user exists or not for security reasons
      return CommonHelpers.createResponse(
        true,
        'If an account with that email exists, a password reset code has been sent.',
        null,
      );
    }

    try {
      // Generate 6-digit random code
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      // Expiry to 30 minutes from now
      const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

      // Update user with reset token and expiry
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      // Send password reset email
      await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.firstName,
        user.lastName,
      );

      this.logger.log(`Password reset token generated for user: ${email}`);

      return CommonHelpers.createResponse(
        true,
        'Password reset code has been sent to your email address.',
        {
          message:
            'Check your email for the 6-digit reset code. The code will expire in 15 minutes.',
        },
      );
    } catch (error) {
      this.logger.error('Failed to process forgot password request:', error);
      throw new BadRequestException('Failed to process password reset request');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, resetToken, newPassword } = resetPasswordDto;

    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // Check if reset token exists and is valid
    if (!user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException(
        'No password reset request found for this email',
      );
    }

    // Check if reset token matches
    if (user.resetToken !== resetToken) {
      throw new BadRequestException('Invalid reset code');
    }

    // Check if reset token has expired
    if (new Date() > user.resetTokenExpiry) {
      throw new BadRequestException(
        'Reset code has expired. Please request a new one.',
      );
    }

    try {
      // Hash new password
      const hashedPassword = await CommonHelpers.hashPassword(newPassword);

      // Update user password and clear reset token and temp password fields
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          tempPassword: null,
          tempPasswordExpiry: null,
        },
      });

      this.logger.log(`Password reset successful for user: ${email}`);

      return CommonHelpers.createResponse(
        true,
        'Password has been reset successfully. You can now log in with your new password.',
        {
          message:
            'Password reset complete. Please log in with your new password.',
        },
      );
    } catch (error) {
      this.logger.error('Failed to reset password:', error);
      throw new BadRequestException('Failed to reset password');
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: { currentPassword: string; newPassword: string },
  ) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find user by ID
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await CommonHelpers.comparePasswords(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is the same as current password
    const isSamePassword = await CommonHelpers.comparePasswords(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    try {
      // Hash new password
      const hashedPassword = await CommonHelpers.hashPassword(newPassword);

      // Update user password and clear temporary password fields if they exist
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          tempPassword: null,
          tempPasswordExpiry: null,
        },
      });

      this.logger.log(`Password changed successfully for user: ${user.email}`);

      return CommonHelpers.createResponse(
        true,
        'Password has been changed successfully.',
        {
          message: 'Your password has been updated successfully.',
        },
      );
    } catch (error) {
      this.logger.error('Failed to change password:', error);
      throw new BadRequestException('Failed to change password');
    }
  }

  async sendVerificationCode(email: string) {
    const code = String(randomInt(100000, 999999));
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const user = await this.prismaService.user.update({
      where: { email },
      data: {
        verificationCode: code,
        verificationCodeExpiry: expiry,
        emailVerified: false,
      },
    });

    await this.emailService.sendWelcomeEmail(
      user.email,
      user.firstName,
      user.lastName,
      code,
    );
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user || !user.verificationCode || !user.verificationCodeExpiry) {
      throw new BadRequestException('No verification code found.');
    }
    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid code.');
    }
    if (user.verificationCodeExpiry < new Date()) {
      throw new BadRequestException('Code expired.');
    }
    await this.prismaService.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });
  }
}
