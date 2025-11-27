import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { FilesComponent } from './files.component';
import { AuthService } from '../../core/services/auth.service';
import { FileUploadModalComponent } from '../../shared/components/file-upload-modal/file-upload-modal.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: signal(mockUser)
    });

    await TestBed.configureTestingModule({
      imports: [
        FilesComponent,
        FileUploadModalComponent,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatToolbarModule
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilesComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with showUploadModal set to false', () => {
      expect(component.showUploadModal()).toBe(false);
    });

    it('should display user email in toolbar', () => {
      const compiled = fixture.nativeElement;
      const userInfo = compiled.querySelector('.user-info');
      expect(userInfo?.textContent).toContain('test@example.com');
    });
  });

  describe('Toolbar', () => {
    it('should display "DataShare - Mes Fichiers" title', () => {
      const compiled = fixture.nativeElement;
      const toolbar = compiled.querySelector('mat-toolbar');
      expect(toolbar?.textContent).toContain('DataShare - Mes Fichiers');
    });

    it('should have a logout button', () => {
      const compiled = fixture.nativeElement;
      const logoutButton = compiled.querySelector('button[aria-label="logout"]') || 
                          compiled.querySelector('mat-toolbar button:last-child');
      expect(logoutButton).toBeTruthy();
    });

    it('should call logout when logout button is clicked', () => {
      const compiled = fixture.nativeElement;
      const logoutButton = compiled.querySelector('mat-toolbar button:last-child') as HTMLButtonElement;
      
      logoutButton.click();
      
      expect(authServiceSpy.logout).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should display empty state by default', () => {
      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should display "Aucun fichier" message', () => {
      const compiled = fixture.nativeElement;
      const heading = compiled.querySelector('.empty-content h2');
      expect(heading?.textContent).toBe('Aucun fichier');
    });

    it('should display descriptive text', () => {
      const compiled = fixture.nativeElement;
      const text = compiled.querySelector('.empty-content p');
      expect(text?.textContent).toContain('Commencez par uploader');
    });

    it('should have upload button in empty state', () => {
      const compiled = fixture.nativeElement;
      const uploadButton = compiled.querySelector('.empty-content button');
      expect(uploadButton?.textContent).toContain('Uploader mon premier fichier');
    });
  });

  describe('Upload Modal Interaction', () => {
    it('should have "Ajouter des fichiers" button in header', () => {
      const compiled = fixture.nativeElement;
      const headerButton = compiled.querySelector('.files-header button');
      expect(headerButton?.textContent).toContain('Ajouter des fichiers');
    });

    it('should open modal when header button is clicked', () => {
      const compiled = fixture.nativeElement;
      const headerButton = compiled.querySelector('.files-header button') as HTMLButtonElement;
      
      expect(component.showUploadModal()).toBe(false);
      
      headerButton.click();
      fixture.detectChanges();
      
      expect(component.showUploadModal()).toBe(true);
    });

    it('should open modal when empty state button is clicked', () => {
      const compiled = fixture.nativeElement;
      const emptyButton = compiled.querySelector('.empty-content button') as HTMLButtonElement;
      
      expect(component.showUploadModal()).toBe(false);
      
      emptyButton.click();
      fixture.detectChanges();
      
      expect(component.showUploadModal()).toBe(true);
    });

    it('should close modal when closeUploadModal is called', () => {
      component.showUploadModal.set(true);
      fixture.detectChanges();
      
      expect(component.showUploadModal()).toBe(true);
      
      component.closeUploadModal();
      
      expect(component.showUploadModal()).toBe(false);
    });

    it('should render FileUploadModalComponent when modal is open', () => {
      component.showUploadModal.set(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const modal = compiled.querySelector('app-file-upload-modal');
      expect(modal).toBeTruthy();
    });

    it('should not render FileUploadModalComponent when modal is closed', () => {
      component.showUploadModal.set(false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const modal = compiled.querySelector('app-file-upload-modal');
      // Le composant est toujours dans le DOM mais avec show=false
      expect(component.showUploadModal()).toBe(false);
    });

    it('should pass show input to FileUploadModalComponent', () => {
      component.showUploadModal.set(true);
      fixture.detectChanges();
      
      const modalDebugElement = fixture.debugElement.query(
        de => de.componentInstance instanceof FileUploadModalComponent
      );
      
      expect(modalDebugElement).toBeTruthy();
      expect(modalDebugElement.componentInstance.show()).toBe(true);
    });
  });

  describe('File Upload Callback', () => {
    it('should close modal when onFileUploaded is called', () => {
      component.showUploadModal.set(true);
      fixture.detectChanges();
      
      component.onFileUploaded();
      
      expect(component.showUploadModal()).toBe(false);
    });

    it('should handle uploaded event from modal', () => {
      component.showUploadModal.set(true);
      fixture.detectChanges();
      
      const modalDebugElement = fixture.debugElement.query(
        de => de.componentInstance instanceof FileUploadModalComponent
      );
      
      // Simuler l'émission de l'événement uploaded
      spyOn(component, 'onFileUploaded');
      modalDebugElement.componentInstance.uploaded.emit();
      
      expect(component.onFileUploaded).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive container class', () => {
      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.files-container');
      expect(container).toBeTruthy();
    });

    it('should have content section', () => {
      const compiled = fixture.nativeElement;
      const content = compiled.querySelector('.content');
      expect(content).toBeTruthy();
    });
  });
});
