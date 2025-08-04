/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailTemplateService } from './email-template.service';
import { EMAIL_TYPES } from '../common/constants';

export interface EmailData {
  to: string;
  subject: string;
  type: string;
  data: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private emailTemplateService: EmailTemplateService,
  ) {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const template = this.emailTemplateService.getTemplate(
        emailData.type,
        emailData.data,
      );

      const mailOptions = {
        from: this.configService.get<string>('MAIL_FROM') as string,
        to: emailData.to,
        subject: emailData.subject || template.subject,
        html: template.html,
        text: template.text,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
    verificationCode: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Plink Logistics Courier Service!',
      type: EMAIL_TYPES.WELCOME,
      data: { firstName, lastName, email, verificationCode },
    });
  }

  async sendParcelStatusUpdate(
    email: string,
    parcelData: any,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Parcel Status Update - ${parcelData.trackingNumber}`,
      type: EMAIL_TYPES.PARCEL_STATUS_UPDATE,
      data: {
        ...parcelData,
        currentLocation: parcelData.currentLocation,
      },
    });
  }

  async sendParcelDeliveredNotification(
    email: string,
    parcelData: any,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Parcel Delivered - ${parcelData.trackingNumber}`,
      type: EMAIL_TYPES.PARCEL_DELIVERED,
      data: parcelData,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName: string,
    lastName: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Code - Plink Logistics',
      type: EMAIL_TYPES.PASSWORD_RESET,
      data: { resetToken, firstName, lastName, email },
    });
  }

  async sendNewParcelRequestNotification(
    adminEmail: string,
    requestData: any,
  ): Promise<boolean> {
    return this.sendEmail({
      to: adminEmail,
      subject: `New Parcel Request - ${requestData.id}`,
      type: EMAIL_TYPES.NEW_PARCEL_REQUEST,
      data: requestData,
    });
  }

  async sendParcelRequestStatusUpdate(
    senderEmail: string,
    requestData: any,
  ): Promise<boolean> {
    return this.sendEmail({
      to: senderEmail,
      subject: `Parcel Request ${requestData.status} - ${requestData.id}`,
      type: EMAIL_TYPES.PARCEL_REQUEST_STATUS_UPDATE,
      data: requestData,
    });
  }

  async sendNewUserCredentials(
    email: string,
    firstName: string,
    lastName: string,
    tempPassword: string,
    expiryDate?: Date,
  ): Promise<boolean> {
    const formattedExpiryDate = expiryDate
      ? expiryDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'within 24 hours';

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Plink Logistics - Your Account Credentials',
      type: EMAIL_TYPES.NEW_USER_CREDENTIALS,
      data: {
        firstName,
        lastName,
        email,
        tempPassword,
        expiryDate: formattedExpiryDate,
      },
    });
  }
  async sendContactMessageReplyEmail(
    email: string,
    name: string,
    subject: string,
    message: string,
    reply: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Reply to Your Contact Message',
      type: EMAIL_TYPES.CONTACT_MESSAGE_REPLY,
      data: { name, email, subject, message, reply },
    });
  }

  async sendParcelRequestRejectedEmail(
    senderEmail: string,
    senderName: string,
    receiverEmail: string,
    description: string,
    weight: number,
    pickupLocation: string,
    destinationLocation: string,
    adminNotes?: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: senderEmail,
      subject: 'Parcel Request Rejected',
      type: 'parcel_request_rejected',
      data: {
        senderName,
        receiverEmail,
        description,
        weight,
        pickupLocation,
        destinationLocation,
        adminNotes,
      },
    });
  }
}
