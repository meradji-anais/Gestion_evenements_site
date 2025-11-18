import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Event {
  id?: number;
  title: string;
  description: string;
  type: string;
  location: string;
  eventDate: string;
  capacity: number;
  organizerName: string;
  organizerEmail: string;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:9090/api/events';

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event);
  }

  searchEvents(keyword: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/search?keyword=${keyword}`);
  }

  getMyEvents(email: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/organizer/${email}`);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}