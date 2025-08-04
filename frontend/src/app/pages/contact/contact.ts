import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, CommonModule, MatIconModule, HttpClientModule],
  standalone: true,
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class Contact {
  contactForm = {
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  };

  isSubmitting = false;
  submitMessage = '';

  constructor(private http: HttpClient) {}

  onSubmit() {
    this.isSubmitting = true;
    this.submitMessage = '';

    this.http.post(`${environment.apiUrl}/contact-messages`, this.contactForm).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitMessage = "Thank you! We've received your message and will respond within 24 hours.";
        setTimeout(() => {
          this.submitMessage = '';
          this.contactForm = {
            name: '',
            email: '',
            phone: '',
            subject: 'General Inquiry',
            message: ''
          };
        }, 3000);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitMessage = "Sorry, there was an error sending your message. Please try again later.";
      }
    });
  }
}
