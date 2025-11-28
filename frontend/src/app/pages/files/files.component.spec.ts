import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { FilesComponent } from './files.component';
import { AuthService } from '../../core/services/auth.service';
import { FileService } from '../../core/services/file.service';
import { FileUploadModalComponent } from '../../shared/components/file-upload-modal/file-upload-modal.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FileMetadata } from '../../core/models/file.model';
import { PageEvent } from '@angular/material/paginator';

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let fileServiceSpy: jasmine.SpyObj<FileService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com'
  };

  const mockFile: FileMetadata = {
    id: 'file-123',
    filename: 'test.pdf',
    fileSize: 1024,
    downloadUrl: '/download/token123',
    downloadToken: 'token123',
    expirationDate: new Date(Date.now() + 86400000).toISOString(),
    isExpired: false,
    hasPassword: false,
    createdAt: new Date().toISOString()
  };

  const mockExpiredFile: FileMetadata = {
    id: 'file-456',
    filename: 'old.pdf',
    fileSize: 2048,
    downloadUrl: '/download/token456',
    downloadToken: 'token456',
    expirationDate: new Date(Date.now() - 86400000).toISOString(),
    isExpired: true,
    hasPassword: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: signal(mockUser)
    });
    
    const fileSpy = jasmine.createSpyObj('FileService', ['getFiles', 'deleteFile', 'downloadFile']);
    fileSpy.getFiles.and.returnValue(of({ files: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10 }));
    fileSpy.downloadFile.and.returnValue(of(new Blob(['test'], { type: 'application/pdf' })));

    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpyObj = jasmine.createSpyObj('MatDialog', ['open']);

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
        { provide: FileService, useValue: fileSpy },
        { provide: MatSnackBar, useValue: snackSpy },
        { provide: MatDialog, useValue: dialogSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilesComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fileServiceSpy = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
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

  describe('Responsive Design', () => {
    it('should have responsive container class', () => {
      const compiled = fixture.nativeElement;
      const page = compiled.querySelector('.files-page');
      expect(page).toBeTruthy();
    });
  });

  describe('Files Loading', () => {
    it('should load files on initialization', () => {
      expect(fileServiceSpy.getFiles).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        sort: 'createdAt,desc',
        includeExpired: true
      });
    });

    it('should display files when loaded', () => {
      fileServiceSpy.getFiles.and.returnValue(of({
        files: [mockFile],
        totalElements: 1,
        totalPages: 1,
        currentPage: 0,
        pageSize: 20
      }));

      component.loadFiles();
      fixture.detectChanges();

      expect(component.files().length).toBe(1);
      expect(component.files()[0]).toEqual(mockFile);
    });

    it('should handle error when loading files fails', () => {
      spyOn(console, 'error'); // Empêche le log d'erreur d'apparaître
      fileServiceSpy.getFiles.and.returnValue(throwError(() => new Error('Network error')));

      component.loadFiles();

      expect(component.error()).toBe('Impossible de charger la liste des fichiers');
      expect(component.isLoading()).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Erreur lors du chargement des fichiers:', jasmine.any(Error));
    });

    it('should set loading state during file loading', () => {
      expect(component.isLoading()).toBe(false);
      
      component.loadFiles();
      
      expect(component.isLoading()).toBe(false); // After observable completes
    });
  });

  describe('File Filtering', () => {
    beforeEach(() => {
      component.files.set([mockFile, mockExpiredFile]);
      component.updateCounts();
    });

    it('should filter active files', () => {
      component.onFilterChange('active');

      expect(component.filteredFiles().length).toBe(1);
      expect(component.filteredFiles()[0].isExpired).toBe(false);
    });

    it('should filter expired files', () => {
      component.onFilterChange('expired');

      expect(component.filteredFiles().length).toBe(1);
      expect(component.filteredFiles()[0].isExpired).toBe(true);
    });

    it('should show all files when filter is "all"', () => {
      component.onFilterChange('all');

      expect(component.filteredFiles().length).toBe(2);
    });

    it('should update counts correctly', () => {
      expect(component.activeFilesCount()).toBe(1);
      expect(component.expiredFilesCount()).toBe(1);
    });
  });

  describe('File Download', () => {
    it('should download file using blob and create download link', () => {
      const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');
      const createElementSpy = spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy('click'),
        href: '',
        download: ''
      } as any);

      component.onDownloadFile(mockFile);

      expect(fileServiceSpy.downloadFile).toHaveBeenCalledWith('token123', undefined);
      expect(createObjectURLSpy).toHaveBeenCalledWith(jasmine.any(Blob));
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('Upload Modal', () => {
    it('should reload files when modal is closed', () => {
      component.showUploadModal.set(true);
      const callsBefore = fileServiceSpy.getFiles.calls.count();
      
      component.closeUploadModal();

      expect(component.showUploadModal()).toBe(false);
      expect(fileServiceSpy.getFiles.calls.count()).toBe(callsBefore + 1);
    });
  });
});
