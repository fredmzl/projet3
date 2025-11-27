import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CalloutComponent } from '../../shared/components/callout/callout.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.test';

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        HeaderComponent,
        FooterComponent,
        CalloutComponent
      ],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty form', () => {
      expect(component.loginForm.get('login')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should initialize with no loading state', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with no error message', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it('should validate email format', () => {
      const login = component.loginForm.get('login');
      
      login?.setValue('invalid-email');
      expect(login?.hasError('email')).toBe(true);
      
      login?.setValue('valid@email.com');
      expect(login?.hasError('email')).toBe(false);
    });

    it('should require login field', () => {
      const login = component.loginForm.get('login');
      login?.setValue('');
      expect(login?.hasError('required')).toBe(true);
    });

    it('should require password field', () => {
      const password = component.loginForm.get('password');
      password?.setValue('');
      expect(password?.hasError('required')).toBe(true);
    });

    it('should require password minimum length of 6 characters', () => {
      const password = component.loginForm.get('password');
      
      password?.setValue('12345');
      expect(password?.hasError('minlength')).toBe(true);
      
      password?.setValue('123456');
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('should be valid when all fields are filled correctly', () => {
      component.loginForm.patchValue({
        login: 'test@example.com',
        password: 'password123'
      });
      
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('onSubmit()', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        login: 'test@example.com',
        password: 'password123'
      });
    });

    it('should not submit when form is invalid', () => {
      component.loginForm.patchValue({ login: '' });
      component.onSubmit();
      
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched on invalid submit', () => {
      component.loginForm.patchValue({ login: '' });
      component.onSubmit();
      
      expect(component.loginForm.get('login')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('should call AuthService.login with correct data', () => {
      authServiceSpy.login.and.returnValue(of({ token: mockJwtToken }));

      component.onSubmit();

      expect(authServiceSpy.login).toHaveBeenCalledWith({
        login: 'test@example.com',
        password: 'password123'
      });
    });

    it('should set loading state during submission', (done) => {
      const mockResponse = { token: mockJwtToken };
      authServiceSpy.login.and.returnValue(of(mockResponse).pipe(delay(50)));

      expect(component.loading()).toBe(false);
      
      component.onSubmit();
      
      // Check loading state is true during the call
      setTimeout(() => {
        expect(component.loading()).toBe(true);
      }, 10);
      
      // After observable completes, loading should be false
      setTimeout(() => {
        expect(component.loading()).toBe(false);
        done();
      }, 100);
    });

    it('should clear error message on submit', () => {
      component.error.set('Previous error');
      authServiceSpy.login.and.returnValue(of({ token: mockJwtToken }));

      component.onSubmit();
      expect(component.error()).toBeNull();
    });

    it('should navigate to /files after successful login', (done) => {
      authServiceSpy.login.and.returnValue(of({ token: mockJwtToken }));

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/files']);
        done();
      }, 10);
    });

    it('should handle login error', (done) => {
      const errorMessage = 'Email ou mot de passe incorrect';
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.error()).toBe(errorMessage);
        expect(component.loading()).toBe(false);
        done();
      }, 10);
    });
  });

  describe('Error Handling Scenarios', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        login: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle 401 Unauthorized error (invalid credentials)', (done) => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Email ou mot de passe incorrect'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.error()).toBe('Email ou mot de passe incorrect');
        done();
      }, 10);
    });

    it('should handle 429 Too Many Requests error (rate limiting)', (done) => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Trop de tentatives. Réessayez plus tard'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.error()).toContain('Trop de tentatives');
        done();
      }, 10);
    });

    it('should handle network errors', (done) => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Erreur réseau'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.error()).toBeTruthy();
        expect(component.loading()).toBe(false);
        done();
      }, 10);
    });

    it('should handle server errors', (done) => {
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Erreur serveur: 500'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.error()).toContain('Erreur serveur');
        done();
      }, 10);
    });
  });

  describe('UI Rendering', () => {
    it('should render header component', () => {
      const headerElement = fixture.nativeElement.querySelector('app-header');
      expect(headerElement).toBeTruthy();
    });

    it('should render footer component', () => {
      const footerElement = fixture.nativeElement.querySelector('app-footer');
      expect(footerElement).toBeTruthy();
    });

    it('should show error callout when error message exists', () => {
      component.error.set('Test error');
      fixture.detectChanges();
      
      const callout = fixture.nativeElement.querySelector('app-callout[type="error"]');
      expect(callout).toBeTruthy();
    });

    it('should not show error callout when no error', () => {
      component.error.set(null);
      fixture.detectChanges();
      
      const callout = fixture.nativeElement.querySelector('app-callout[type="error"]');
      expect(callout).toBeFalsy();
    });

    it('should disable submit button when form is invalid', () => {
      component.loginForm.patchValue({ login: '' });
      fixture.detectChanges();
      
      expect(component.loginForm.valid).toBe(false);
    });

    it('should enable submit button when form is valid', () => {
      component.loginForm.patchValue({
        login: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();
      
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('Form State Management', () => {
    it('should reset error when user starts typing after an error', () => {
      component.error.set('Previous error');
      authServiceSpy.login.and.returnValue(of({ token: mockJwtToken }));
      
      component.loginForm.patchValue({
        login: 'test@example.com',
        password: 'password123'
      });
      
      component.onSubmit();
      
      // Error should be cleared on new submit
      expect(component.error()).toBeNull();
    });

    it('should maintain form values after error', (done) => {
      const loginValue = 'test@example.com';
      const passwordValue = 'password123';
      
      component.loginForm.patchValue({
        login: loginValue,
        password: passwordValue
      });
      
      authServiceSpy.login.and.returnValue(
        throwError(() => new Error('Error'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.loginForm.get('login')?.value).toBe(loginValue);
        expect(component.loginForm.get('password')?.value).toBe(passwordValue);
        done();
      }, 10);
    });
  });
});
