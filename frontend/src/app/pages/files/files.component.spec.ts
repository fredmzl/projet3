import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { FilesComponent } from './files.component';
import { AuthService } from '../../core/services/auth.service';
import { FileService } from '../../core/services/file.service';
import { FileUploadModalComponent } from '../../shared/components/file-upload-modal/file-upload-modal.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let fileServiceSpy: jasmine.SpyObj<FileService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: signal(mockUser)
    });
    
    const fileSpy = jasmine.createSpyObj('FileService', ['getFiles', 'deleteFile']);
    fileSpy.getFiles.and.returnValue(of({ files: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10 }));

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
        { provide: AuthService, useValue: authSpy },
        { provide: FileService, useValue: fileSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilesComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fileServiceSpy = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;
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
      const userEmail = compiled.querySelector('.user-email');
      expect(userEmail?.textContent?.trim()).toContain('test@example.com');
    });
  });

  describe('Toolbar', () => {
    it('should display "DataShare - Mes Fichiers" title', () => {
      const compiled = fixture.nativeElement;
      const sidebar = compiled.querySelector('.sidebar-logo');
      expect(sidebar?.textContent?.trim()).toContain('DataShare');
    });

    it('should have a logout button', () => {
      const compiled = fixture.nativeElement;
      const logoutButton = compiled.querySelector('.logout-button');
      expect(logoutButton).toBeTruthy();
    });

    it('should call logout when logout button is clicked', () => {
      const compiled = fixture.nativeElement;
      const logoutButton = compiled.querySelector('.logout-button') as HTMLButtonElement;
      
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
      const heading = compiled.querySelector('.empty-state h2');
      expect(heading?.textContent?.trim()).toBe('Aucun fichier uploadé');
    });

    it('should display descriptive text', () => {
      const compiled = fixture.nativeElement;
      const text = compiled.querySelector('.text-muted');
      expect(text?.textContent).toContain('Commencez par uploader');
    });

    it('should have upload button in empty state', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.empty-state .upload-button');
      expect(button?.textContent).toContain('Uploader mon premier fichier');
    });
  });

  describe('Upload Modal Interaction', () => {
    it('should have "Ajouter des fichiers" button in header', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.header-actions .upload-button');
      expect(button?.textContent).toContain('Ajouter des fichiers');
    });

    it('should open modal when header button is clicked', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.header-actions .upload-button') as HTMLButtonElement;
      
      expect(component.showUploadModal()).toBe(false);
      
      button.click();
      fixture.detectChanges();
      
      expect(component.showUploadModal()).toBe(true);
    });

    it('should open modal when empty state button is clicked', () => {
      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.empty-state .upload-button') as HTMLButtonElement;
      
      expect(component.showUploadModal()).toBe(false);
      
      button.click();
      fixture.detectChanges();
      
      expect(component.showUploadModal()).toBe(true);
    });
  });

  describe('File Upload Callback', () => {
    it('should close modal when onFileUploaded is called', () => {
      component.showUploadModal.set(true);
      fixture.detectChanges();
      
      component.onFileUploaded();
      
      expect(component.showUploadModal()).toBe(false);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive container class', () => {
      const compiled = fixture.nativeElement;
      const page = compiled.querySelector('.files-page');
      expect(page).toBeTruthy();
    });
  });
});
