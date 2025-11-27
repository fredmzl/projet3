import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default year as current year', () => {
      const currentYear = new Date().getFullYear();
      expect(component.year()).toBe(currentYear);
    });

    it('should accept year input', () => {
      fixture.componentRef.setInput('year', 2024);
      fixture.detectChanges();
      expect(component.year()).toBe(2024);
    });
  });

  describe('Template Rendering', () => {
    it('should render footer element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('footer.footer');
      expect(footer).toBeTruthy();
    });

    it('should render copyright paragraph', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright).toBeTruthy();
    });

    it('should display copyright text with current year by default', () => {
      const currentYear = new Date().getFullYear();
      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain(`Copyright DataShare© ${currentYear}`);
    });
  });

  describe('Year Display', () => {
    it('should display correct year when specified', () => {
      fixture.componentRef.setInput('year', 2023);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain('Copyright DataShare© 2023');
    });

    it('should update displayed year when input changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');

      fixture.componentRef.setInput('year', 2020);
      fixture.detectChanges();
      expect(copyright?.textContent).toContain('2020');

      fixture.componentRef.setInput('year', 2025);
      fixture.detectChanges();
      expect(copyright?.textContent).toContain('2025');
    });

    it('should handle future years', () => {
      fixture.componentRef.setInput('year', 2030);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain('2030');
    });

    it('should handle past years', () => {
      fixture.componentRef.setInput('year', 2010);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain('2010');
    });
  });

  describe('Copyright Text Format', () => {
    it('should contain "Copyright" text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain('Copyright');
    });

    it('should contain "DataShare" text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain('DataShare');
    });

    it('should contain copyright symbol', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toContain('©');
    });

    it('should have correct text format', () => {
      fixture.componentRef.setInput('year', 2024);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const copyright = compiled.querySelector('p.copyright');
      expect(copyright?.textContent).toBe('Copyright DataShare© 2024');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic footer tag', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const footer = compiled.querySelector('footer');
      expect(footer).toBeTruthy();
    });

    it('should use paragraph tag for copyright text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const paragraph = compiled.querySelector('p.copyright');
      expect(paragraph).toBeTruthy();
      expect(paragraph?.tagName.toLowerCase()).toBe('p');
    });
  });
});
