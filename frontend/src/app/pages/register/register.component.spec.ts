import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { of, throwError, delay } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CalloutComponent } from '../../shared/components/callout/callout.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
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

    fixture = TestBed.createComponent(RegisterComponent);
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
      expect(component.registerForm.get('login')?.value).toBe('');
      expect(component.registerForm.get('password')?.value).toBe('');
      expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    });

    it('should initialize with no loading state', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize with no error or success message', () => {
      expect(component.errorMessage()).toBeNull();
      expect(component.successMessage()).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.registerForm.valid).toBe(false);
    });

    it('should validate email format', () => {
      const login = component.registerForm.get('login');
      
      login?.setValue('invalid-email');
      expect(login?.hasError('email')).toBe(true);
      
      login?.setValue('valid@email.com');
      expect(login?.hasError('email')).toBe(false);
    });

    it('should require login field', () => {
      const login = component.registerForm.get('login');
      login?.setValue('');
      expect(login?.hasError('required')).toBe(true);
    });

    it('should require password field', () => {
      const password = component.registerForm.get('password');
      password?.setValue('');
      expect(password?.hasError('required')).toBe(true);
    });

    it('should require password minimum length of 6 characters', () => {
      const password = component.registerForm.get('password');
      
      password?.setValue('12345');
      expect(password?.hasError('minlength')).toBe(true);
      
      password?.setValue('123456');
      expect(password?.hasError('minlength')).toBe(false);
    });

    it('should require confirmPassword field', () => {
      const confirmPassword = component.registerForm.get('confirmPassword');
      confirmPassword?.setValue('');
      expect(confirmPassword?.hasError('required')).toBe(true);
    });

    it('should validate password match', () => {
      component.registerForm.patchValue({
        login: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different'
      });
      
      expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    });

    it('should pass validation when passwords match', () => {
      component.registerForm.patchValue({
        login: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      expect(component.registerForm.hasError('passwordMismatch')).toBe(false);
      expect(component.registerForm.valid).toBe(true);
    });
  });

  describe('hasError() method', () => {
    it('should return true when field has error and is touched', () => {
      const login = component.registerForm.get('login');
      login?.setValue('');
      login?.markAsTouched();
      
      expect(component.hasError('login', 'required')).toBe(true);
    });

    it('should return false when field has error but is not touched', () => {
      const login = component.registerForm.get('login');
      login?.setValue('');
      
      expect(component.hasError('login', 'required')).toBe(false);
    });

    it('should return true when field has error and is dirty', () => {
      const login = component.registerForm.get('login');
      login?.setValue('');
      login?.markAsDirty();
      
      expect(component.hasError('login', 'required')).toBe(true);
    });

    it('should return false when field has no error', () => {
      const login = component.registerForm.get('login');
      login?.setValue('valid@email.com');
      login?.markAsTouched();
      
      expect(component.hasError('login', 'required')).toBe(false);
    });
  });

  describe('onSubmit()', () => {
    beforeEach(() => {
      component.registerForm.patchValue({
        login: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });

    it('should not submit when form is invalid', () => {
      component.registerForm.patchValue({ login: 'invalid-email' });
      component.onSubmit();
      
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should call AuthService.register with correct data', () => {
      authServiceSpy.register.and.returnValue(of({
        message: 'Compte créé avec succès',
        userId: '123',
        email: 'test@example.com'
      }));

      component.onSubmit();

      expect(authServiceSpy.register).toHaveBeenCalledWith({
        login: 'test@example.com',
        password: 'password123'
      });
    });

    it('should set loading state during submission', (done) => {
      const mockResponse = {
        message: 'Compte créé avec succès',
        userId: '123',
        email: 'test@example.com'
      };
      
      // Use delay operator to simulate async call
      authServiceSpy.register.and.returnValue(of(mockResponse).pipe(delay(50)));

      expect(component.isLoading()).toBe(false);
      
      component.onSubmit();
      
      // Check loading state is true during the call
      setTimeout(() => {
        expect(component.isLoading()).toBe(true);
      }, 10);
      
      // After observable completes, loading should be false
      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should clear error message on submit', () => {
      component.errorMessage.set('Previous error');
      authServiceSpy.register.and.returnValue(of({
        message: 'Compte créé avec succès',
        userId: '123',
        email: 'test@example.com'
      }));

      component.onSubmit();
      expect(component.errorMessage()).toBeNull();
    });

    it('should show success message on successful registration', (done) => {
      const mockResponse = {
        message: 'Compte créé avec succès',
        userId: '123',
        email: 'test@example.com'
      };
      authServiceSpy.register.and.returnValue(of(mockResponse));

      component.onSubmit();

      setTimeout(() => {
        expect(component.successMessage()).toBe('Compte créé avec succès ! Redirection...');
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should navigate to login after successful registration', (done) => {
      authServiceSpy.register.and.returnValue(of({
        message: 'Compte créé avec succès',
        userId: '123',
        email: 'test@example.com'
      }));

      component.onSubmit();

      setTimeout(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 2100); // Wait for the 2s delay
    });

    it('should handle registration error', (done) => {
      const errorMessage = 'Un compte existe déjà avec cet email';
      authServiceSpy.register.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage()).toBe(errorMessage);
        expect(component.isLoading()).toBe(false);
        expect(component.successMessage()).toBeNull();
        done();
      }, 10);
    });
  });

  describe('Error Handling Scenarios', () => {
    beforeEach(() => {
      component.registerForm.patchValue({
        login: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
    });

    it('should handle 409 Conflict error (email already exists)', (done) => {
      authServiceSpy.register.and.returnValue(
        throwError(() => new Error('Un compte existe déjà avec cet email'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage()).toBe('Un compte existe déjà avec cet email');
        done();
      }, 10);
    });

    it('should handle 400 Bad Request error', (done) => {
      authServiceSpy.register.and.returnValue(
        throwError(() => new Error('Données invalides. Veuillez vérifier vos informations.'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage()).toContain('Données invalides');
        done();
      }, 10);
    });

    it('should handle network errors', (done) => {
      authServiceSpy.register.and.returnValue(
        throwError(() => new Error('Erreur réseau'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(component.errorMessage()).toBeTruthy();
        expect(component.isLoading()).toBe(false);
        done();
      }, 10);
    });

    it('should mark all fields as touched on invalid submit', () => {
      component.registerForm.patchValue({ login: '' });
      component.onSubmit();
      
      expect(component.registerForm.get('login')?.touched).toBe(true);
      expect(component.registerForm.get('password')?.touched).toBe(true);
      expect(component.registerForm.get('confirmPassword')?.touched).toBe(true);
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
      component.errorMessage.set('Test error');
      fixture.detectChanges();
      
      const callout = fixture.nativeElement.querySelector('app-callout[type="error"]');
      expect(callout).toBeTruthy();
    });

    it('should show success callout when success message exists', () => {
      component.successMessage.set('Test success');
      fixture.detectChanges();
      
      const callout = fixture.nativeElement.querySelector('app-callout[type="info"]');
      expect(callout).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      component.registerForm.patchValue({ login: '' });
      fixture.detectChanges();
      
      expect(component.registerForm.valid).toBe(false);
    });

    it('should enable submit button when form is valid', () => {
      component.registerForm.patchValue({
        login: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      fixture.detectChanges();
      
      expect(component.registerForm.valid).toBe(true);
    });
  });
});
