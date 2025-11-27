import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { routes } from '../app.routes';
import { AuthService } from '../core/services/auth.service';
import { HomeComponent } from '../pages/home/home.component';
import { RegisterComponent } from '../pages/register/register.component';
import { LoginComponent } from '../pages/login/login.component';
import { FilesComponent } from '../pages/files/files.component';

describe('Integration Tests - User Flows', () => {
  let router: Router;
  let location: Location;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.test';

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'register',
      'login',
      'logout',
      'isAuthenticated'
    ], {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'test', email: 'test@test.com' })
    });

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        RegisterComponent,
        LoginComponent,
        FilesComponent
      ],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  describe('Complete Registration Flow', () => {
    it('should allow navigation to register page', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Navigate to register
      router.navigate(['/register']);
      tick();
      expect(location.path()).toBe('/register');
    }));

    it('should stay on register page when registration fails', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(
        throwError(() => new Error('Email déjà utilisé'))
      );
      authServiceSpy.isAuthenticated.and.returnValue(false);

      router.navigate(['/register']);
      tick();

      const fixture = TestBed.createComponent(RegisterComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.registerForm.patchValue({
        login: 'existing@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();
      tick(50);
      fixture.detectChanges();

      // Should stay on register page
      expect(location.path()).toBe('/register');
      expect(component.errorMessage()).toBeTruthy();
    }));
  });

  describe('Complete Login Flow', () => {
    it('should allow navigation to login page', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');
    }));

    it('should stay on login page when credentials are invalid', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Email ou mot de passe incorrect'))
      );
      authServiceSpy.isAuthenticated.and.returnValue(false);

      router.navigate(['/login']);
      tick();

      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.loginForm.patchValue({
        login: 'wrong@test.com',
        password: 'wrongpass'
      });

      component.onSubmit();
      tick(50);
      fixture.detectChanges();

      // Should stay on login page
      expect(location.path()).toBe('/login');
      expect(component.error()).toBeTruthy();
    }));
  });

  describe('Complete Register → Login → Files Flow', () => {
    it('should allow navigation through public pages', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Navigate to register
      router.navigate(['/register']);
      tick();
      expect(location.path()).toBe('/register');

      // Navigate to login
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Navigate to home
      router.navigate(['']);
      tick();
      expect(location.path()).toBe('');
    }));
  });

  describe('Protected Route Access', () => {
    it('should redirect to login when accessing /files without authentication', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      router.navigate(['/files']);
      tick();

      // Should redirect to login
      expect(location.path()).toBe('/login');
    }));

    it('should allow access to /files when authenticated', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      router.navigate(['/files']);
      tick();

      // Should access files page
      expect(location.path()).toBe('/files');
    }));

    it('should allow unauthenticated access to public routes', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Home
      router.navigate(['']);
      tick();
      expect(location.path()).toBe('');

      // Login
      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Register
      router.navigate(['/register']);
      tick();
      expect(location.path()).toBe('/register');
    }));
  });

  describe('Logout Flow', () => {
    it('should allow access to files when authenticated', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      router.navigate(['/files']);
      tick();
      expect(location.path()).toBe('/files');
    }));

    it('should prevent access to protected routes when not authenticated', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Try to access files
      router.navigate(['/files']);
      tick();

      // Should be redirected to login
      expect(location.path()).toBe('/login');
    }));
  });

  describe('Navigation State Consistency', () => {
    it('should maintain correct navigation history', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Navigate through multiple routes
      router.navigate(['']);
      tick();
      expect(location.path()).toBe('');

      router.navigate(['/register']);
      tick();
      expect(location.path()).toBe('/register');

      router.navigate(['/login']);
      tick();
      expect(location.path()).toBe('/login');

      // Back navigation
      location.back();
      tick();
      expect(location.path()).toBe('/register');

      location.back();
      tick();
      expect(location.path()).toBe('');
    }));

    it('should handle rapid navigation changes', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Rapid navigation
      router.navigate(['/register']);
      router.navigate(['/login']);
      router.navigate(['']);
      tick();

      // Should end up at the last requested route
      expect(location.path()).toBe('');
    }));
  });

  describe('Form State Across Navigation', () => {
    it('should reset form when navigating away and back', fakeAsync(() => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      // Navigate to login
      router.navigate(['/login']);
      tick();

      const fixture1 = TestBed.createComponent(LoginComponent);
      fixture1.detectChanges();
      const component1 = fixture1.componentInstance;

      // Fill form
      component1.loginForm.patchValue({
        login: 'test@test.com',
        password: 'test123'
      });

      // Navigate away
      router.navigate(['/register']);
      tick();

      // Navigate back to login
      router.navigate(['/login']);
      tick();

      const fixture2 = TestBed.createComponent(LoginComponent);
      fixture2.detectChanges();
      const component2 = fixture2.componentInstance;

      // Form should be empty
      expect(component2.loginForm.get('login')?.value).toBe('');
      expect(component2.loginForm.get('password')?.value).toBe('');
    }));
  });

  describe('Error Recovery Flows', () => {
    it('should stay on register page after failed registration', fakeAsync(() => {
      authServiceSpy.register.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      authServiceSpy.isAuthenticated.and.returnValue(false);

      router.navigate(['/register']);
      tick();

      const fixture = TestBed.createComponent(RegisterComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.registerForm.patchValue({
        login: 'user@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      });

      component.onSubmit();
      tick(50);
      fixture.detectChanges();

      expect(component.errorMessage()).toBeTruthy();
      expect(location.path()).toBe('/register');
    }));

    it('should stay on login page after failed login', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Invalid credentials'))
      );
      authServiceSpy.isAuthenticated.and.returnValue(false);

      router.navigate(['/login']);
      tick();

      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.loginForm.patchValue({
        login: 'user@test.com',
        password: 'wrongpass'
      });

      component.onSubmit();
      tick(50);
      fixture.detectChanges();

      expect(component.error()).toBeTruthy();
      expect(location.path()).toBe('/login');
    }));
  });
});
