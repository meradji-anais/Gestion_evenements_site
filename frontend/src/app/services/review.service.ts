import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id?: number;
  eventId: number;
  participantName: string;
  participantEmail: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private baseUrl = 'http://localhost:9090/api/reviews';

  constructor(private http: HttpClient) {}

  // Créer une évaluation
  createReview(review: Review): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, review);
  }

  // Obtenir les évaluations d'un événement
  getReviewsByEvent(eventId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/event/${eventId}`);
  }

  // Vérifier si un participant a déjà évalué
  hasParticipantReviewed(eventId: number, email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/event/${eventId}/participant/${email}`);
  }

  // Statistiques d'évaluations
  getEventReviewStats(eventId: number): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.baseUrl}/event/${eventId}/stats`);
  }
}