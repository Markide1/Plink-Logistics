/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EMAIL_TYPES } from '../common/constants';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async addWelcomeEmailJob(email: string, firstName: string, lastName: string) {
    try {
      const job = await this.emailQueue.add(
        'send-welcome-email',
        {
          type: EMAIL_TYPES.WELCOME,
          to: email,
          data: { email, firstName, lastName },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`Welcome email job added: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add welcome email job:', error);
      throw error;
    }
  }

  async addParcelStatusUpdateJob(email: string, parcelData: any) {
    try {
      const job = await this.emailQueue.add(
        'send-parcel-status-update',
        {
          type: EMAIL_TYPES.PARCEL_STATUS_UPDATE,
          to: email,
          data: parcelData,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`Parcel status update email job added: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add parcel status update email job:', error);
      throw error;
    }
  }

  async addParcelDeliveredJob(email: string, parcelData: any) {
    try {
      const job = await this.emailQueue.add(
        'send-parcel-delivered',
        {
          type: EMAIL_TYPES.PARCEL_DELIVERED,
          to: email,
          data: parcelData,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`Parcel delivered email job added: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add parcel delivered email job:', error);
      throw error;
    }
  }

  async addGenericEmailJob(
    to: string,
    type: string,
    data: any,
    subject?: string,
    priority?: number,
  ) {
    try {
      const job = await this.emailQueue.add(
        'send-generic-email',
        {
          type,
          to,
          data,
          subject,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          priority: priority || 0,
        },
      );

      this.logger.log(`Generic email job added: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add generic email job:', error);
      throw error;
    }
  }

  async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.emailQueue.getWaiting(),
        this.emailQueue.getActive(),
        this.emailQueue.getCompleted(),
        this.emailQueue.getFailed(),
        this.emailQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  async clearQueue() {
    try {
      await this.emailQueue.clean(0, 'completed');
      await this.emailQueue.clean(0, 'failed');
      this.logger.log('Email queue cleared');
    } catch (error) {
      this.logger.error('Failed to clear email queue:', error);
      throw error;
    }
  }
}
