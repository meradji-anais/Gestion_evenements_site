import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs'; 

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'ORGANIZER' | 'PARTICIPANT';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private apiUrl = '/api/auth';
  
 
  
  private currentUserSubject = new BehaviorSubject<AuthUser | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkCurrentUser();
  }

  register(email: string, password: string, confirmPassword: string, role: string): Observable<AuthUser> {
    return (this.http.post(`${this.apiUrl}/register`, 
      { email, password, confirmPassword, role }, 
      { withCredentials: true, responseType: 'text' }
    ) as Observable<string>)
      .pipe(
        map(responseText => JSON.parse(responseText) as AuthUser), 
        tap(user => this.currentUserSubject.next(user))
      );
  }

  login(email: string, password: string): Observable<AuthUser> {
    return (this.http.post(`${this.apiUrl}/login`, 
      { email, password }, 
      { withCredentials: true, responseType: 'text' }
    ) as Observable<string>)
      .pipe(
        map(responseText => JSON.parse(responseText) as AuthUser),
        tap(user => this.currentUserSubject.next(user))
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.currentUserSubject.next(null)));
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/current-user`, { withCredentials: true });
  }

  checkCurrentUser(): void {
    this.getCurrentUser().subscribe({
      next: (user) => {
        console.log(' Utilisateur récupéré:', user);
        this.currentUserSubject.next(user);  
      },
      error: () => {
        console.log(' Pas d\'utilisateur connecté');
        this.currentUserSubject.next(null);  
      }
    });
  }

  get currentUserValue(): AuthUser | null | undefined {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const value = this.currentUserSubject.value;
    return value !== null && value !== undefined;
  }
  
  isOrganizer(): boolean {
    return this.currentUserSubject.value?.role === 'ORGANIZER';
  }
  
  isParticipant(): boolean {
    return this.currentUserSubject.value?.role === 'PARTICIPANT';
  }
}