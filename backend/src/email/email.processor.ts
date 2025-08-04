/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';

export interface EmailJob {
  type: string;
  to: string;
  data: any;
  subject?: string;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-welcome-email')
  async handleWelcomeEmail(job: Job<EmailJob>) {
    this.logger.debug(`Processing welcome email job: ${job.id}`);

    try {
      const { data } = job.data;
      await this.emailService.sendWelcomeEmail(
        data.email,
        data.firstName,
        data.lastName,
        data.verificationCode,
      );

      this.logger.log(`Welcome email sent successfully to: ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-parcel-status-update')
  async handleParcelStatusUpdate(job: Job<EmailJob>) {
    this.logger.debug(`Processing parcel status update email job: ${job.id}`);

    try {
      const { to, data } = job.data;
      await this.emailService.sendParcelStatusUpdate(to, data);

      this.logger.log(`Parcel status update email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send parcel status update email: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-parcel-delivered')
  async handleParcelDelivered(job: Job<EmailJob>) {
    this.logger.debug(`Processing parcel delivered email job: ${job.id}`);

    try {
      const { to, data } = job.data;
      await this.emailService.sendParcelDeliveredNotification(to, data);

      this.logger.log(`Parcel delivered email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send parcel delivered email: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-generic-email')
  async handleGenericEmail(job: Job<EmailJob>) {
    this.logger.debug(`Processing generic email job: ${job.id}`);

    try {
      const { to, type, data, subject } = job.data;
      await this.emailService.sendEmail({
        to,
        type,
        data,
        subject: subject || '',
      });

      this.logger.log(`Generic email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send generic email: ${error.message}`,
        error,
      );
      throw error;
    }
  }
}
