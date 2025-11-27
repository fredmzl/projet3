import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalloutComponent, CalloutType } from './callout.component';

describe('CalloutComponent', () => {
  let component: CalloutComponent;
  let fixture: ComponentFixture<CalloutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalloutComponent]
    }).compileComponents();
  });

  describe('Component Initialization', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Test message');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should require message input', () => {
      expect(component.message()).toBe('Test message');
    });

    it('should have default type as "info"', () => {
      expect(component.type()).toBe('info');
    });

    it('should accept type input', () => {
      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();
      expect(component.type()).toBe('error');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Test message');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should render callout container', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout');
      expect(callout).toBeTruthy();
    });

    it('should have role="alert" for accessibility', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('[role="alert"]');
      expect(callout).toBeTruthy();
    });

    it('should render icon span', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.callout-icon');
      expect(icon).toBeTruthy();
    });

    it('should render message span', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.callout-message');
      expect(message).toBeTruthy();
    });

    it('should display the provided message', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.callout-message');
      expect(message?.textContent).toBe('Test message');
    });
  });

  describe('Info Type', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Info message');
      fixture.componentRef.setInput('type', 'info');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have info CSS class', () => {
      expect(component.calloutClasses()).toBe('callout callout--info');
    });

    it('should apply info class to element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout--info');
      expect(callout).toBeTruthy();
    });

    it('should display info icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.callout-icon');
      expect(icon?.textContent).toBe('ℹ️');
    });
  });

  describe('Warning Type', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Warning message');
      fixture.componentRef.setInput('type', 'warning');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have warning CSS class', () => {
      expect(component.calloutClasses()).toBe('callout callout--warning');
    });

    it('should apply warning class to element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout--warning');
      expect(callout).toBeTruthy();
    });

    it('should display warning icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.callout-icon');
      expect(icon?.textContent).toBe('⚠️');
    });
  });

  describe('Error Type', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Error message');
      fixture.componentRef.setInput('type', 'error');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have error CSS class', () => {
      expect(component.calloutClasses()).toBe('callout callout--error');
    });

    it('should apply error class to element', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout--error');
      expect(callout).toBeTruthy();
    });

    it('should display error icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.callout-icon');
      expect(icon?.textContent).toBe('❌');
    });
  });

  describe('Type Switching', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Test message');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should update CSS class when type changes', () => {
      fixture.componentRef.setInput('type', 'info');
      fixture.detectChanges();
      expect(component.calloutClasses()).toBe('callout callout--info');

      fixture.componentRef.setInput('type', 'warning');
      fixture.detectChanges();
      expect(component.calloutClasses()).toBe('callout callout--warning');

      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();
      expect(component.calloutClasses()).toBe('callout callout--error');
    });

    it('should update icon when type changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.callout-icon');

      fixture.componentRef.setInput('type', 'info');
      fixture.detectChanges();
      expect(icon?.textContent).toBe('ℹ️');

      fixture.componentRef.setInput('type', 'warning');
      fixture.detectChanges();
      expect(icon?.textContent).toBe('⚠️');

      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();
      expect(icon?.textContent).toBe('❌');
    });
  });

  describe('Message Updates', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Initial message');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should update displayed message when input changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.callout-message');

      expect(message?.textContent).toBe('Initial message');

      fixture.componentRef.setInput('message', 'Updated message');
      fixture.detectChanges();
      expect(message?.textContent).toBe('Updated message');
    });

    it('should handle empty messages', () => {
      fixture.componentRef.setInput('message', '');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.callout-message');
      expect(message?.textContent).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long message that should still be displayed correctly in the callout component without any issues';
      fixture.componentRef.setInput('message', longMessage);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.callout-message');
      expect(message?.textContent).toBe(longMessage);
    });
  });

  describe('Icon Map', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Test');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have correct icon map', () => {
      expect(component.iconMap).toEqual({
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌'
      });
    });

    it('should map info type to info icon', () => {
      expect(component.iconMap['info']).toBe('ℹ️');
    });

    it('should map warning type to warning icon', () => {
      expect(component.iconMap['warning']).toBe('⚠️');
    });

    it('should map error type to error icon', () => {
      expect(component.iconMap['error']).toBe('❌');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(CalloutComponent);
      fixture.componentRef.setInput('message', 'Test message');
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should have role="alert" attribute', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('[role="alert"]');
      expect(callout).toBeTruthy();
    });

    it('should maintain role="alert" across type changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      fixture.componentRef.setInput('type', 'info');
      fixture.detectChanges();
      expect(compiled.querySelector('[role="alert"]')).toBeTruthy();

      fixture.componentRef.setInput('type', 'warning');
      fixture.detectChanges();
      expect(compiled.querySelector('[role="alert"]')).toBeTruthy();

      fixture.componentRef.setInput('type', 'error');
      fixture.detectChanges();
      expect(compiled.querySelector('[role="alert"]')).toBeTruthy();
    });
  });
});
