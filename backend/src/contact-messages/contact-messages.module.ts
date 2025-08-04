import { Module } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { ContactMessagesController } from './contact-messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  providers: [ContactMessagesService],
  controllers: [ContactMessagesController],
  imports: [PrismaModule, EmailModule],
})
export class ContactMessagesModule {}
