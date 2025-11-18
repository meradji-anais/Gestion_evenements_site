import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Participant {
  id?: number;
  eventId: number;
  name: string;
  email: string;
  status?: string;
  registeredAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = 'http://localhost:9090/api/participants';

  constructor(private http: HttpClient) {}

  register(participant: Participant): Observable<Participant> {
    return this.http.post<Participant>(this.apiUrl, participant);
  }

  getMyRegistrations(email: string): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/email/${email}`);
  }

  getParticipantsByEvent(eventId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/event/${eventId}`);
  }

  unregister(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}