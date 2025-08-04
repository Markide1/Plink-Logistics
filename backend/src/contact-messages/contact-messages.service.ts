/* eslint-disable @typescript-eslint/no-unused-vars */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { EMAIL_TYPES } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
} from './dto/contact-message.dto';

@Injectable()
export class ContactMessagesService {
  private readonly logger = new Logger(ContactMessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
  ) {}

  async createMessage(data: CreateContactMessageDto) {
    try {
      return await this.prisma.contactMessage.create({ data });
    } catch (error) {
      this.logger.error('Failed to create contact message', error);
      throw error;
    }
  }

  async getAllMessages() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async replyToMessage(id: string, reply: string) {
    const updated = await this.prisma.contactMessage.update({
      where: { id },
      data: { replied: true, reply },
    });

    // Send reply email
    try {
      await this.emailService.sendEmail({
        to: updated.email,
        subject: 'Reply to Your Contact Message',
        type: EMAIL_TYPES.CONTACT_MESSAGE_REPLY,
        data: {
          name: updated.name,
          email: updated.email,
          subject: updated.subject,
          message: updated.message,
          reply: updated.reply,
        },
      });
    } catch (err) {
      this.logger.error('Failed to send contact message reply email', err);
    }
    return updated;
  }
}
