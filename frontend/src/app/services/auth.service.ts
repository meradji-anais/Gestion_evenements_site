import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'ORGANIZER' | 'PARTICIPANT';
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  name: string;
  role: 'ORGANIZER' | 'PARTICIPANT';
}

const TOKEN_KEY = 'auth-token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  
  
  private currentUserSubject = new BehaviorSubject<AuthUser | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.checkCurrentUser();
  }

  private saveToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  public getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  register(email: string, password: string, confirmPassword: string, role: string): Observable<AuthUser> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/register`, 
      { email, password, confirmPassword, role }
    ).pipe(
      tap(response => {
        console.log(' Inscription réussie, token reçu');
        this.saveToken(response.token);
        const user: AuthUser = {
          id: response.id,
          email: response.email,
          name: response.name,
          role: response.role
        };
        this.currentUserSubject.next(user);
      })
    );
  }

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, 
      { email, password }
    ).pipe(
      tap(response => {
        console.log(' Connexion réussie, token reçu');
        this.saveToken(response.token);
        const user: AuthUser = {
          id: response.id,
          email: response.email,
          name: response.name,
          role: response.role
        };
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): Observable<any> {
    console.log(' Suppression du token et de la session...');
  
    this.removeToken();
    this.currentUserSubject.next(null);
    
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        console.log(' Déconnexion confirmée par le backend');
      }),
      catchError(err => {
        console.warn(' Erreur backend lors de la déconnexion (ignorée):', err);
        return of({ message: 'Déconnecté (frontend uniquement)' });
      })
    );
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/current-user`, {
      headers: this.getAuthHeaders()
    });
  }

  
  checkCurrentUser(): void {
    if (!this.isBrowser) {
      console.log(' Exécution côté serveur, attente du navigateur...');
      
      return;
    }
    
    const token = this.getToken();
    
    if (!token) {
      console.log(' Pas de token trouvé');
      this.currentUserSubject.next(null);
      return;
    }

    console.log(' Token trouvé, vérification en cours...');
    
    this.getCurrentUser().pipe(
      catchError(err => {
        console.error(' Token invalide ou expiré', err);
        this.removeToken();
        this.currentUserSubject.next(null);
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        if (user) {
          console.log(' Utilisateur récupéré:', user);
          this.currentUserSubject.next(user);
        }
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

  //  Réinitialisation du mot de passe
  resetPassword(email: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, 
      { email, newPassword, confirmPassword }
    ).pipe(
      tap(() => {
        console.log(' Mot de passe réinitialisé avec succès');
      })
    );
  }
}