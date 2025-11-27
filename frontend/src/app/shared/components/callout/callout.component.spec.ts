import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { CalloutComponent, CalloutType } from './callout.component';

describe('CalloutComponent', () => {
  let fixture: ComponentFixture<any>;

  @Component({
    template: '<app-callout [type]="type">{{message}}</app-callout>',
    imports: [CalloutComponent]
  })
  class TestHostComponent {
    message = 'Test message';
    type: CalloutType = 'info';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalloutComponent, TestHostComponent]
    }).compileComponents();
  });

  describe('Component Initialization', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it('should create', () => {
      const component = fixture.debugElement.children[0].componentInstance;
      expect(component).toBeTruthy();
    });

    it('should display projected content', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.callout__label');
      expect(label?.textContent?.trim()).toBe('Test message');
    });

    it('should have default type as "info"', () => {
      const component = fixture.debugElement.children[0].componentInstance;
      expect(component.type).toBe('info');
    });

    it('should accept type input', () => {
      fixture.componentInstance.type = 'error';
      fixture.detectChanges();
      const component = fixture.debugElement.children[0].componentInstance;
      expect(component.type).toBe('error');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it('should render callout container', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout');
      expect(callout).toBeTruthy();
    });

    it('should render icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('.callout__icon');
      expect(icon).toBeTruthy();
    });

    it('should render label span', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.callout__label');
      expect(label).toBeTruthy();
    });

    it('should display the projected content', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.callout__label');
      expect(label?.textContent?.trim()).toBe('Test message');
    });
  });

  describe('Info Type', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.type = 'info';
      fixture.detectChanges();
    });

    it('should have info CSS class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout--info');
      expect(callout).toBeTruthy();
    });

    it('should display info icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('info');
    });
  });

  describe('Warning Type', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.type = 'warning';
      fixture.detectChanges();
    });

    it('should have warning CSS class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout--warning');
      expect(callout).toBeTruthy();
    });

    it('should display warning icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('warning');
    });
  });

  describe('Error Type', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.type = 'error';
      fixture.detectChanges();
    });

    it('should have error CSS class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const callout = compiled.querySelector('.callout--error');
      expect(callout).toBeTruthy();
    });

    it('should display error icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('error');
    });
  });

  describe('Type Switching', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it('should update CSS class when type changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      fixture.componentInstance.type = 'info';
      fixture.detectChanges();
      expect(compiled.querySelector('.callout--info')).toBeTruthy();

      fixture.componentInstance.type = 'warning';
      fixture.detectChanges();
      expect(compiled.querySelector('.callout--warning')).toBeTruthy();

      fixture.componentInstance.type = 'error';
      fixture.detectChanges();
      expect(compiled.querySelector('.callout--error')).toBeTruthy();
    });

    it('should update icon when type changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icon = compiled.querySelector('mat-icon');

      fixture.componentInstance.type = 'info';
      fixture.detectChanges();
      expect(icon?.textContent?.trim()).toBe('info');

      fixture.componentInstance.type = 'warning';
      fixture.detectChanges();
      expect(icon?.textContent?.trim()).toBe('warning');

      fixture.componentInstance.type = 'error';
      fixture.detectChanges();
      expect(icon?.textContent?.trim()).toBe('error');
    });
  });

  describe('Message Updates', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it('should update displayed message when content changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.callout__label');

      expect(label?.textContent?.trim()).toBe('Test message');

      fixture.componentInstance.message = 'Updated message';
      fixture.detectChanges();
      expect(label?.textContent?.trim()).toBe('Updated message');
    });

    it('should handle empty messages', () => {
      fixture.componentInstance.message = '';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.callout__label');
      expect(label?.textContent?.trim()).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long message that should still be displayed correctly in the callout component without any issues';
      fixture.componentInstance.message = longMessage;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const label = compiled.querySelector('.callout__label');
      expect(label?.textContent?.trim()).toBe(longMessage);
    });
  });

  describe('Icon Rendering', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
    });

    it('should have getIcon method', () => {
      const component = fixture.debugElement.children[0].componentInstance;
      expect(component.getIcon).toBeDefined();
    });

    it('should return info icon for info type', () => {
      const component = fixture.debugElement.children[0].componentInstance;
      component.type = 'info';
      expect(component.getIcon()).toBe('info');
    });

    it('should return warning icon for warning type', () => {
      const component = fixture.debugElement.children[0].componentInstance;
      component.type = 'warning';
      expect(component.getIcon()).toBe('warning');
    });

    it('should return error icon for error type', () => {
      const component = fixture.debugElement.children[0].componentInstance;
      component.type = 'error';
      expect(component.getIcon()).toBe('error');
    });
  });
});
