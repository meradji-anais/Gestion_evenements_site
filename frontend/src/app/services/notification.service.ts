import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  id?: number;
  email: string;
  type: string;
  message: string;
  eventId: number;
  isRead?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:9090/api/notifications';

  constructor(private http: HttpClient) {}

  createNotification(notification: any): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, notification);
  }

  getNotifications(email: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/${email}`);
  }

  getUnreadNotifications(email: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/${email}/unread`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  // Permanently delete a notification by id
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}