import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailProcessor } from './email.processor';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [
    EmailService,
    EmailTemplateService,
    EmailProcessor,
    EmailQueueService,
  ],
  exports: [EmailService, EmailQueueService],
})
export class EmailModule {}
