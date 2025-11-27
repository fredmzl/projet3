import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RegisterRequest, RegisterResponse } from '../models/Register';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

interface JwtPayload {
  sub: string;  // email/login
  iat: number;  // issued at
  exp: number;  // expiration
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // État en signals
  private readonly tokenKey = 'jwt_token';
  private readonly userKey = 'current_user';
  
  isAuthenticated = signal<boolean>(this.hasToken());
  currentUser = signal<{ id: string; email: string } | null>(this.getStoredUser());
  
  // URL de l'API configurée selon l'environnement
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Connexion d'un utilisateur existant
   */
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        this.setToken(response.token);
        
        // Décoder le JWT pour extraire les informations utilisateur
        const payload = this.decodeJwt(response.token);
        if (payload) {
          const user = {
            id: payload.sub,  // Le backend utilise 'sub' pour l'email/login
            email: payload.sub
          };
          this.setUser(user);
          this.currentUser.set(user);
        }
        
        this.isAuthenticated.set(true);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.clearToken();
    this.clearUser();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Récupère le token JWT stocké
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Vérifie si un token existe
   */
  private hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Stocke le token JWT
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Supprime le token JWT
   */
  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Décoder le JWT pour extraire le payload
   */
  private decodeJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du JWT:', error);
      return null;
    }
  }

  /**
   * Stocke les informations utilisateur
   */
  private setUser(user: { id: string; email: string }): void {
    localStorage.setItem(this.userKey, JSON.stringify({
      id: user.id,
      email: user.email
    }));
  }

  /**
   * Récupère les informations utilisateur stockées
   */
  private getStoredUser(): { id: string; email: string } | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Supprime les informations utilisateur
   */
  private clearUser(): void {
    localStorage.removeItem(this.userKey);
  }

  /**
   * Gestion centralisée des erreurs HTTP conforme à l'OpenAPI spec
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (réseau, etc.)
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur - Codes conformes à l'OpenAPI spec
      switch (error.status) {
        case 400: // Bad Request - Validation échouée
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
          }
          break;
        
        case 401: // Unauthorized - Identifiants invalides
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        
        case 409: // Conflict - Email déjà utilisé
          errorMessage = 'Un compte existe déjà avec cet email';
          break;
        
        case 429: // Too Many Requests - Rate limiting
          errorMessage = 'Trop de tentatives. Réessayez plus tard';
          break;
        
        default:
          // Utiliser le message du serveur si disponible
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Erreur serveur: ${error.status}`;
          }
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
