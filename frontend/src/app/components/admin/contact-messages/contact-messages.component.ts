import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactMessagesService, ContactMessage } from '../../../services/contact-messages.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-contact-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-messages.component.html',
  styleUrls: ['./contact-messages.component.scss']
})
export class AdminContactMessagesComponent implements OnInit {
  messages: ContactMessage[] = [];
  selectedMessage: ContactMessage | null = null;
  replyText: string = '';
  isLoading = false;
  isReplying = false;
  error = '';

  constructor(private contactMessagesService: ContactMessagesService) {}

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.isLoading = true;
    this.contactMessagesService.getAll().subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load messages.';
        this.isLoading = false;
      }
    });
  }

  selectMessage(msg: ContactMessage) {
    this.selectedMessage = msg;
    this.replyText = msg.reply || '';
    if (!msg.isRead) {
      this.contactMessagesService.markAsRead(msg.id).subscribe();
      msg.isRead = true;
    }
  }

  sendReply() {
    if (!this.selectedMessage) return;
    this.isReplying = true;
    this.contactMessagesService.reply(this.selectedMessage.id, this.replyText).subscribe({
      next: (updated) => {
        this.selectedMessage = updated;
        this.isReplying = false;
      },
      error: () => {
        this.error = 'Failed to send reply.';
        this.isReplying = false;
      }
    });
  }

  closeMessage() {
    this.selectedMessage = null;
    this.replyText = '';
    this.error = '';
  }
}
