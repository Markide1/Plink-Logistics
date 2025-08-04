import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ContactMessagesService } from './contact-messages.service';
import {
  CreateContactMessageDto,
  ReplyContactMessageDto,
} from './dto/contact-message.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Contact Messages')
@Controller('contact-messages')
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
  ) {}

  @ApiOperation({ summary: 'Submit a contact message (public)' })
  @ApiBody({ type: CreateContactMessageDto })
  @ApiResponse({ status: 201, description: 'Message created.' })
  @Post()
  async create(@Body() body: CreateContactMessageDto): Promise<any> {
    return this.contactMessagesService.createMessage(body);
  }

  @ApiOperation({ summary: 'Get all contact messages (admin only)' })
  @ApiResponse({ status: 200, description: 'List of messages.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getAll() {
    return this.contactMessagesService.getAllMessages();
  }

  @ApiOperation({ summary: 'Mark a message as read (admin only)' })
  @ApiResponse({ status: 200, description: 'Message marked as read.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.contactMessagesService.markAsRead(id);
  }

  @ApiOperation({ summary: 'Reply to a contact message (admin only)' })
  @ApiBody({ type: ReplyContactMessageDto })
  @ApiResponse({ status: 200, description: 'Message replied.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/reply')
  async reply(@Param('id') id: string, @Body() body: ReplyContactMessageDto) {
    return this.contactMessagesService.replyToMessage(id, body.reply);
  }
}
