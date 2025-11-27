import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RegisterRequest } from '../models/Register';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const apiUrl = `${environment.apiUrl}/auth`;

  const mockRegisterRequest: RegisterRequest = {
    login: 'test@example.com',
    password: 'password123'
  };

  const mockLoginRequest = {
    login: 'test@example.com',
    password: 'password123'
  };

  const mockJwtToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYzMjU0MjJ9.test';

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with isAuthenticated false when no token', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should detect token presence after login', (done) => {
      const mockResponse = { token: mockJwtToken };
      
      // Service starts without authentication
      expect(service.isAuthenticated()).toBe(false);
      
      // After login, should be authenticated
      service.login(mockLoginRequest).subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        expect(service.currentUser()).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });
  });

  describe('register()', () => {
    it('should send POST request to /api/auth/register', () => {
      const mockResponse = {
        message: 'Compte créé avec succès',
        userId: '123',
        email: 'test@example.com'
      };

      service.register(mockRegisterRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterRequest);
      req.flush(mockResponse);
    });

    it('should handle 400 Bad Request error', () => {
      const errorMessage = 'Données invalides';

      service.register(mockRegisterRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toContain('Données invalides');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 409 Conflict error (email already exists)', () => {
      service.register(mockRegisterRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Un compte existe déjà avec cet email');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush({}, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('login()', () => {
    it('should send POST request to /api/auth/login', () => {
      const mockResponse = { token: mockJwtToken };

      service.login(mockLoginRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockLoginRequest);
      req.flush(mockResponse);
    });

    it('should store token in localStorage after successful login', (done) => {
      const mockResponse = { token: mockJwtToken };

      service.login(mockLoginRequest).subscribe(() => {
        expect(localStorage.getItem('jwt_token')).toBe(mockJwtToken);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });

    it('should decode JWT and extract user email', (done) => {
      const mockResponse = { token: mockJwtToken };

      service.login(mockLoginRequest).subscribe(() => {
        const currentUser = service.currentUser();
        expect(currentUser).toBeTruthy();
        expect(currentUser?.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });

    it('should update isAuthenticated signal to true', (done) => {
      const mockResponse = { token: mockJwtToken };

      service.login(mockLoginRequest).subscribe(() => {
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });

    it('should store user in localStorage', (done) => {
      const mockResponse = { token: mockJwtToken };

      service.login(mockLoginRequest).subscribe(() => {
        const storedUser = localStorage.getItem('current_user');
        expect(storedUser).toBeTruthy();
        const user = JSON.parse(storedUser!);
        expect(user.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });

    it('should handle 401 Unauthorized error', () => {
      service.login(mockLoginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Email ou mot de passe incorrect');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 429 Too Many Requests error', () => {
      service.login(mockLoginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Trop de tentatives. Réessayez plus tard');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({}, { status: 429, statusText: 'Too Many Requests' });
    });
  });

  describe('logout()', () => {
    beforeEach(() => {
      // Setup authenticated state
      localStorage.setItem('jwt_token', mockJwtToken);
      localStorage.setItem('current_user', JSON.stringify({ id: '123', email: 'test@example.com' }));
      service.isAuthenticated.set(true);
      service.currentUser.set({ id: '123', email: 'test@example.com' });
    });

    it('should clear token from localStorage', () => {
      service.logout();
      expect(localStorage.getItem('jwt_token')).toBeNull();
    });

    it('should clear user from localStorage', () => {
      service.logout();
      expect(localStorage.getItem('current_user')).toBeNull();
    });

    it('should update isAuthenticated signal to false', () => {
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should update currentUser signal to null', () => {
      service.logout();
      expect(service.currentUser()).toBeNull();
    });

    it('should navigate to /login', () => {
      service.logout();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getToken()', () => {
    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return token when it exists', () => {
      localStorage.setItem('jwt_token', mockJwtToken);
      expect(service.getToken()).toBe(mockJwtToken);
    });
  });

  describe('JWT Decoding', () => {
    it('should correctly decode valid JWT token', (done) => {
      const validToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYzMjU0MjJ9.test';
      const mockResponse = { token: validToken };

      service.login(mockLoginRequest).subscribe(() => {
        const user = service.currentUser();
        expect(user?.email).toBe('user@example.com');
        expect(user?.id).toBe('user@example.com');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });

    it('should handle invalid JWT token gracefully', (done) => {
      const invalidToken = 'invalid.token.structure';
      const mockResponse = { token: invalidToken };

      service.login(mockLoginRequest).subscribe(() => {
        // Should still set authenticated but with no user data
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      service.login(mockLoginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toContain('Erreur');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Network error' });
    });

    it('should handle server errors (500)', () => {
      service.login(mockLoginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toContain('Erreur serveur');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should use custom error message from server if available', () => {
      const customMessage = 'Erreur personnalisée du serveur';

      service.login(mockLoginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe(customMessage);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ message: customMessage }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
