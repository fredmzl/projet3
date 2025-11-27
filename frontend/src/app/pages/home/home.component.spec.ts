import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, HeaderComponent, FooterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
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

    it('should render header component', () => {
      const compiled = fixture.nativeElement;
      const header = compiled.querySelector('app-header');
      expect(header).toBeTruthy();
    });

    it('should render footer component', () => {
      const compiled = fixture.nativeElement;
      const footer = compiled.querySelector('app-footer');
      expect(footer).toBeTruthy();
    });
  });

  describe('handleUploadClick', () => {
    it('should navigate to /files when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      component.handleUploadClick();

      expect(router.navigate).toHaveBeenCalledWith(['/files']);
    });

    it('should navigate to /login when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      component.handleUploadClick();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('handleHeaderButtonClick', () => {
    it('should navigate to /files when user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);

      component.handleHeaderButtonClick();

      expect(router.navigate).toHaveBeenCalledWith(['/files']);
    });

    it('should navigate to /login when user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);

      component.handleHeaderButtonClick();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Template', () => {
    it('should have main content section', () => {
      const compiled = fixture.nativeElement;
      const main = compiled.querySelector('main.main-content');
      expect(main).toBeTruthy();
    });

    it('should display title', () => {
      const compiled = fixture.nativeElement;
      const title = compiled.querySelector('.title');
      expect(title).toBeTruthy();
      expect(title?.textContent).toContain('Tu veux partager un fichier');
    });

    it('should have upload button', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.upload-button');
      expect(button).toBeTruthy();
    });
  });
});
