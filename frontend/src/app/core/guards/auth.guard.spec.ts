import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy }
      ]
    });

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
  });

  describe('Authentication Check', () => {
    it('should allow access when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      ));

      expect(result).toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      ));

      expect(result).not.toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('Redirection', () => {
    it('should redirect to /login when not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      )) as UrlTree;

      expect(result).toBeInstanceOf(UrlTree);
      expect(result.toString()).toBe('/login');
    });

    it('should not redirect when authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      ));

      expect(result).toBe(true);
      expect(result).not.toBeInstanceOf(UrlTree);
    });
  });

  describe('Multiple Calls', () => {
    it('should consistently allow access for authenticated user', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result1 = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      ));
      const result2 = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      ));

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(2);
    });

    it('should consistently deny access for unauthenticated user', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result1 = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      )) as UrlTree;
      const result2 = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      )) as UrlTree;

      expect(result1.toString()).toBe('/login');
      expect(result2.toString()).toBe('/login');
      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle authentication state change between calls', () => {
      // First call - not authenticated
      authServiceSpy.isAuthenticated.and.returnValue(false);
      const result1 = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      )) as UrlTree;

      expect(result1.toString()).toBe('/login');

      // Second call - authenticated
      authServiceSpy.isAuthenticated.and.returnValue(true);
      const result2 = TestBed.runInInjectionContext(() => authGuard(
        {} as any,
        {} as any
      ));

      expect(result2).toBe(true);
    });

    it('should call isAuthenticated on every guard execution', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

      expect(authServiceSpy.isAuthenticated).toHaveBeenCalledTimes(3);
    });
  });

  describe('Route Parameters', () => {
    it('should work regardless of route parameters', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => authGuard(
        { params: { id: '123' } } as any,
        { url: '/files' } as any
      ));

      expect(result).toBe(true);
    });

    it('should redirect to /login regardless of attempted route', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => authGuard(
        { params: { id: '456' } } as any,
        { url: '/files/456' } as any
      )) as UrlTree;

      expect(result.toString()).toBe('/login');
    });
  });
});
