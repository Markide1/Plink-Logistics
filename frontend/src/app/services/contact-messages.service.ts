import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  replied: boolean;
  reply?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactMessagesService {
  private apiUrl = `${environment.apiUrl}/contact-messages`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(this.apiUrl);
  }

  reply(id: string, reply: string): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}/${id}/reply`, { reply });
  }

  markAsRead(id: string): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}/${id}/read`, {});
  }
}
