import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  const mockData: ConfirmDialogData = {
    title: 'Supprimer le fichier ?',
    message: 'Êtes-vous sûr de vouloir supprimer ce fichier ?\n\nCette action est irréversible.',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    confirmColor: 'warn'
  };

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data', () => {
      expect(component.data).toEqual(mockData);
    });
  });

  describe('Template Rendering', () => {
    it('should display title with warning icon', () => {
      const titleElement = fixture.debugElement.query(By.css('h2'));
      expect(titleElement.nativeElement.textContent).toContain('Supprimer le fichier ?');
      
      const iconElement = fixture.debugElement.query(By.css('.dialog-icon'));
      expect(iconElement.nativeElement.textContent).toBe('warning');
    });

    it('should display message', () => {
      const messageElement = fixture.debugElement.query(By.css('.dialog-message'));
      expect(messageElement.nativeElement.textContent).toContain('Êtes-vous sûr');
      expect(messageElement.nativeElement.textContent).toContain('irréversible');
    });

    it('should display custom confirm button text', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1]; // Second button
      expect(confirmButton.nativeElement.textContent.trim()).toBe('Supprimer');
    });

    it('should display custom cancel button text', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const cancelButton = buttons[0]; // First button
      expect(cancelButton.nativeElement.textContent.trim()).toBe('Annuler');
    });

    it('should apply warn color to confirm button', () => {
      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      const confirmButton = buttons[1];
      expect(confirmButton.nativeElement.classList.contains('mat-warn')).toBe(true);
    });

    it('should display default confirm text when not provided', () => {
      const dataWithoutConfirmText: ConfirmDialogData = {
        title: 'Test',
        message: 'Message'
      };
      
      component.data = dataWithoutConfirmText;
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1];
      expect(confirmButton.nativeElement.textContent.trim()).toBe('Confirmer');
    });

    it('should display default cancel text when not provided', () => {
      const dataWithoutCancelText: ConfirmDialogData = {
        title: 'Test',
        message: 'Message'
      };
      
      component.data = dataWithoutCancelText;
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const cancelButton = buttons[0];
      expect(cancelButton.nativeElement.textContent.trim()).toBe('Annuler');
    });
  });

  describe('User Interactions', () => {
    it('should close dialog with true when confirm button is clicked', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1];
      
      confirmButton.nativeElement.click();
      
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with false when cancel button is clicked', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const cancelButton = buttons[0];
      
      cancelButton.nativeElement.click();
      
      expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should call onConfirm when confirm button is clicked', () => {
      spyOn(component, 'onConfirm');
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1];
      confirmButton.nativeElement.click();
      
      expect(component.onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      spyOn(component, 'onCancel');
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const cancelButton = buttons[0];
      cancelButton.nativeElement.click();
      
      expect(component.onCancel).toHaveBeenCalled();
    });
  });

  describe('Dialog Styling', () => {
    it('should have warning icon with correct color', () => {
      const icon = fixture.debugElement.query(By.css('.dialog-icon'));
      const styles = window.getComputedStyle(icon.nativeElement);
      expect(icon.nativeElement.textContent).toBe('warning');
    });

    it('should have mat-dialog-actions aligned to end', () => {
      const actions = fixture.debugElement.query(By.css('mat-dialog-actions'));
      expect(actions.nativeElement.getAttribute('align')).toBe('end');
    });

    it('should have two buttons in dialog actions', () => {
      const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
      expect(buttons.length).toBe(2);
    });

    it('should preserve line breaks in message', () => {
      const messageElement = fixture.debugElement.query(By.css('.dialog-message'));
      const styles = window.getComputedStyle(messageElement.nativeElement);
      expect(styles.whiteSpace).toBe('pre-line');
    });
  });

  describe('Different Confirm Colors', () => {
    it('should apply primary color when specified', () => {
      component.data = {
        ...mockData,
        confirmColor: 'primary'
      };
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1];
      expect(confirmButton.nativeElement.classList.contains('mat-primary')).toBe(true);
    });

    it('should apply accent color when specified', () => {
      component.data = {
        ...mockData,
        confirmColor: 'accent'
      };
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1];
      expect(confirmButton.nativeElement.classList.contains('mat-accent')).toBe(true);
    });

    it('should default to primary color when not specified', () => {
      const dataWithoutColor: ConfirmDialogData = {
        title: 'Test',
        message: 'Message'
      };
      component.data = dataWithoutColor;
      fixture.detectChanges();
      
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const confirmButton = buttons[1];
      expect(confirmButton.nativeElement.classList.contains('mat-primary')).toBe(true);
    });
  });
});
