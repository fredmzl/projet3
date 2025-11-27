import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, HeaderVariant } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default variant as "login"', () => {
      expect(component.variant()).toBe('login');
    });

    it('should accept variant input', () => {
      fixture.componentRef.setInput('variant', 'authenticated');
      fixture.detectChanges();
      expect(component.variant()).toBe('authenticated');
    });
  });

  describe('Template Rendering', () => {
    it('should render logo "DataShare"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const logo = compiled.querySelector('.logo');
      expect(logo?.textContent).toBe('DataShare');
    });

    it('should render header element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('header.header');
      expect(header).toBeTruthy();
    });

    it('should render button element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button).toBeTruthy();
    });
  });

  describe('Login Variant', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('variant', 'login');
      fixture.detectChanges();
    });

    it('should display "Se connecter" button text for login variant', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button?.textContent?.trim()).toBe('Se connecter');
    });

    it('should have correct aria-label for login variant', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button?.getAttribute('aria-label')).toBe('Se connecter');
    });
  });

  describe('Authenticated Variant', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('variant', 'authenticated');
      fixture.detectChanges();
    });

    it('should display "Mon espace" button text for authenticated variant', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button?.textContent?.trim()).toBe('Mon espace');
    });

    it('should have correct aria-label for authenticated variant', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button?.getAttribute('aria-label')).toBe('Accéder à mon espace');
    });
  });

  describe('Variant Switching', () => {
    it('should update button text when variant changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');

      // Start with login
      fixture.componentRef.setInput('variant', 'login');
      fixture.detectChanges();
      expect(button?.textContent?.trim()).toBe('Se connecter');

      // Switch to authenticated
      fixture.componentRef.setInput('variant', 'authenticated');
      fixture.detectChanges();
      expect(button?.textContent?.trim()).toBe('Mon espace');

      // Switch back to login
      fixture.componentRef.setInput('variant', 'login');
      fixture.detectChanges();
      expect(button?.textContent?.trim()).toBe('Se connecter');
    });

    it('should update aria-label when variant changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');

      fixture.componentRef.setInput('variant', 'login');
      fixture.detectChanges();
      expect(button?.getAttribute('aria-label')).toBe('Se connecter');

      fixture.componentRef.setInput('variant', 'authenticated');
      fixture.detectChanges();
      expect(button?.getAttribute('aria-label')).toBe('Accéder à mon espace');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate button type', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button?.getAttribute('type')).toBe('button');
    });

    it('should have aria-label attribute', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('button.header-button');
      expect(button?.hasAttribute('aria-label')).toBe(true);
    });

    it('should have semantic header tag', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const header = compiled.querySelector('header');
      expect(header).toBeTruthy();
    });
  });
});
