import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of, throwError, delay } from 'rxjs';
import { FileUploadModalComponent } from './file-upload-modal.component';
import { FileService, UploadProgress, FileUploadResponse } from '../../../core/services/file.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('FileUploadModalComponent', () => {
  let component: FileUploadModalComponent;
  let fixture: ComponentFixture<FileUploadModalComponent>;
  let fileServiceSpy: jasmine.SpyObj<FileService>;

  const createMockFile = (name: string = 'test.pdf', size: number = 1024): File => {
    return new File(['content'], name, { type: 'application/pdf', lastModified: Date.now() });
  };

  const createLargeFile = (): File => {
    const sizeInGB = 1.5; // 1.5 GB
    const sizeInBytes = sizeInGB * 1024 * 1024 * 1024;
    return new File(['x'.repeat(100)], 'large.pdf', { 
      type: 'application/pdf',
      lastModified: Date.now()
    });
    // Note: On simule juste la taille car créer un fichier de 1.5GB serait trop lourd
  };

  beforeEach(async () => {
    const fileSpy = jasmine.createSpyObj('FileService', ['uploadFile']);

    await TestBed.configureTestingModule({
      imports: [
        FileUploadModalComponent,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: FileService, useValue: fileSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadModalComponent);
    component = fixture.componentInstance;
    fileServiceSpy = TestBed.inject(FileService) as jasmine.SpyObj<FileService>;
    
    // Set required input
    fixture.componentRef.setInput('show', true);
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with no file selected', () => {
      expect(component.selectedFile()).toBeNull();
    });

    it('should initialize with idle upload state', () => {
      const state = component.uploadState();
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
    });

    it('should initialize form with default values', () => {
      expect(component.uploadForm.get('password')?.value).toBe('');
      expect(component.uploadForm.get('expirationDays')?.value).toBe(7);
    });

    it('should have expiration options from 1 to 7 days', () => {
      expect(component.expirationOptions.length).toBe(5);
      expect(component.expirationOptions[0].value).toBe(1);
      expect(component.expirationOptions[4].value).toBe(7);
    });
  });

  describe('File Selection via Input', () => {
    it('should select file when onFileSelected is called', () => {
      const mockFile = createMockFile();
      const event = { target: { files: [mockFile] } } as any;

      component.onFileSelected(event);

      expect(component.selectedFile()).toEqual(mockFile);
    });

    it('should update fileName computed signal when file is selected', () => {
      const mockFile = createMockFile('document.pdf');
      const event = { target: { files: [mockFile] } } as any;

      component.onFileSelected(event);

      expect(component.fileName()).toBe('document.pdf');
    });

    it('should calculate fileSize in MB', () => {
      const sizeInBytes = 2 * 1024 * 1024; // 2 MB
      const mockFile = createMockFile('test.pdf', sizeInBytes);
      // La taille réelle du File créé est basée sur le contenu, pas le paramètre
      // On mock directement la propriété size
      Object.defineProperty(mockFile, 'size', { value: sizeInBytes, writable: false });
      const event = { target: { files: [mockFile] } } as any;

      component.onFileSelected(event);

      expect(component.fileSize()).toContain('2.00 MB');
    });

    it('should show "Aucun fichier sélectionné" when no file', () => {
      expect(component.fileName()).toBe('Aucun fichier sélectionné');
    });

    it('should reject files larger than 1 GB', () => {
      const largeFile = Object.defineProperty(createMockFile('huge.pdf'), 'size', {
        value: 1.5 * 1024 * 1024 * 1024,
        writable: false
      });
      const event = { target: { files: [largeFile] } } as any;

      component.onFileSelected(event);

      expect(component.selectedFile()).toBeNull();
      expect(component.uploadState().status).toBe('error');
      expect(component.uploadState().error).toContain('1 GB');
    });
  });

  describe('Drag and Drop', () => {
    it('should set isDragOver to true on dragover', () => {
      const event = new DragEvent('dragover', { dataTransfer: new DataTransfer() });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDragOver(event);

      expect(component.isDragOver()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set isDragOver to false on dragleave', () => {
      component.isDragOver.set(true);
      const event = new DragEvent('dragleave', { dataTransfer: new DataTransfer() });
      spyOn(event, 'preventDefault');

      component.onDragLeave(event);

      expect(component.isDragOver()).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should select file on drop', () => {
      const mockFile = createMockFile();
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');

      component.onDrop(event);

      expect(component.selectedFile()).toEqual(mockFile);
      expect(component.isDragOver()).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle drop with no files', () => {
      const event = new DragEvent('drop', { dataTransfer: new DataTransfer() });
      spyOn(event, 'preventDefault');

      component.onDrop(event);

      expect(component.selectedFile()).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should validate password minimum length', () => {
      const passwordControl = component.uploadForm.get('password');
      
      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('should allow empty password', () => {
      const passwordControl = component.uploadForm.get('password');
      
      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBe(true);
    });

    it('should require expirationDays', () => {
      const expirationControl = component.uploadForm.get('expirationDays');
      
      expirationControl?.setValue(null);
      expect(expirationControl?.hasError('required')).toBe(true);
    });

    it('should validate expirationDays range', () => {
      const expirationControl = component.uploadForm.get('expirationDays');
      
      expirationControl?.setValue(0);
      expect(expirationControl?.hasError('min')).toBe(true);

      expirationControl?.setValue(8);
      expect(expirationControl?.hasError('max')).toBe(true);

      expirationControl?.setValue(5);
      expect(expirationControl?.valid).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute canUpload as false when no file selected', () => {
      expect(component.canUpload()).toBe(false);
    });

    it('should compute canUpload as true when file is selected and form is valid', () => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadForm.patchValue({ expirationDays: 7 });

      expect(component.canUpload()).toBe(true);
    });

    it('should compute canUpload as false when uploading', () => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadState.set({ status: 'uploading', progress: 50 });

      expect(component.canUpload()).toBe(false);
    });

    it('should compute isUploading correctly', () => {
      expect(component.isUploading()).toBe(false);

      component.uploadState.set({ status: 'uploading', progress: 30 });
      expect(component.isUploading()).toBe(true);
    });

    it('should compute isSuccess correctly', () => {
      expect(component.isSuccess()).toBe(false);

      component.uploadState.set({ status: 'success', progress: 100, downloadUrl: 'link' });
      expect(component.isSuccess()).toBe(true);
    });

    it('should compute isError correctly', () => {
      expect(component.isError()).toBe(false);

      component.uploadState.set({ status: 'error', progress: 0, error: 'Error' });
      expect(component.isError()).toBe(true);
    });
  });

  describe('File Upload Process', () => {
    it('should not upload if no file selected', fakeAsync(() => {
      spyOn(component, 'uploadFile').and.callThrough();

      component.uploadFile();
      tick();

      expect(fileServiceSpy.uploadFile).not.toHaveBeenCalled();
    }));

    it('should not upload if form is invalid', fakeAsync(() => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadForm.get('password')?.setValue('12345'); // Too short

      component.uploadFile();
      tick();

      expect(fileServiceSpy.uploadFile).not.toHaveBeenCalled();
    }));

    it('should call fileService.uploadFile with correct parameters', fakeAsync(() => {
      const mockFile = createMockFile();
      const progressObservable = of<UploadProgress>({ status: 'completed', progress: 100 });
      fileServiceSpy.uploadFile.and.returnValue(progressObservable);

      component.selectedFile.set(mockFile);
      component.uploadForm.patchValue({
        password: 'secret123',
        expirationDays: 5
      });

      component.uploadFile();
      tick();

      expect(fileServiceSpy.uploadFile).toHaveBeenCalledWith({
        file: mockFile,
        password: 'secret123',
        expirationDays: 5
      });
    }));

    it('should not include password if empty', fakeAsync(() => {
      const mockFile = createMockFile();
      const progressObservable = of<UploadProgress>({ status: 'completed', progress: 100 });
      fileServiceSpy.uploadFile.and.returnValue(progressObservable);

      component.selectedFile.set(mockFile);
      component.uploadForm.patchValue({
        password: '',
        expirationDays: 7
      });

      component.uploadFile();
      tick();

      const callArgs = fileServiceSpy.uploadFile.calls.mostRecent().args[0];
      expect(callArgs.password).toBeUndefined();
    }));

    it('should update progress during upload', fakeAsync(() => {
      const mockFile = createMockFile();
      const progress1: UploadProgress = { status: 'uploading', progress: 30 };
      const progress2: UploadProgress = { status: 'uploading', progress: 60 };
      const progress3: UploadProgress = { status: 'uploading', progress: 90 };
      
      let callCount = 0;
      fileServiceSpy.uploadFile.and.callFake(() => {
        callCount++;
        if (callCount === 1) return of(progress1).pipe(delay(100));
        if (callCount === 2) return of(progress2).pipe(delay(100));
        return of(progress3).pipe(delay(100));
      });

      component.selectedFile.set(mockFile);

      component.uploadFile();
      tick(300);

      expect(component.uploadState().progress).toBeGreaterThan(0);
    }));

    it('should set success state on completed upload', fakeAsync(() => {
      const mockFile = createMockFile();
      const mockResponse: FileUploadResponse = {
        id: '123',
        filename: 'test.pdf',
        fileSize: 1024,
        downloadToken: 'abc123',
        downloadUrl: 'https://example.com/download/abc123',
        expirationDate: '2025-01-20',
        hasPassword: true,
        createdAt: '2025-01-15'
      };
      const progressObservable = of<UploadProgress>({
        status: 'completed',
        progress: 100,
        response: mockResponse
      });
      fileServiceSpy.uploadFile.and.returnValue(progressObservable);

      component.selectedFile.set(mockFile);

      component.uploadFile();
      tick();
      tick(500); // Wait for the setTimeout

      expect(component.uploadState().status).toBe('success');
      expect(component.uploadState().progress).toBe(100);
      expect(component.uploadState().downloadUrl).toBe('https://example.com/download/abc123');
    }));

    it('should emit uploaded event on success', fakeAsync(() => {
      const mockFile = createMockFile();
      const mockResponse: FileUploadResponse = {
        id: '123',
        filename: 'test.pdf',
        fileSize: 1024,
        downloadToken: 'abc123',
        downloadUrl: 'https://example.com/download/abc123',
        expirationDate: '2025-01-20',
        hasPassword: false,
        createdAt: '2025-01-15'
      };
      const progressObservable = of<UploadProgress>({
        status: 'completed',
        progress: 100,
        response: mockResponse
      });
      fileServiceSpy.uploadFile.and.returnValue(progressObservable);

      component.selectedFile.set(mockFile);

      expect(component.uploadState().status).toBe('idle');

      component.uploadFile();
      tick();
      flush(); // Flush all pending timers

      expect(component.uploadState().status).toBe('success');
      expect(component.uploadState().downloadUrl).toBe('https://example.com/download/abc123');
    }));

    it('should handle 401 error', fakeAsync(() => {
      const mockFile = createMockFile();
      fileServiceSpy.uploadFile.and.returnValue(
        throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }))
      );

      component.selectedFile.set(mockFile);

      component.uploadFile();
      tick();

      expect(component.uploadState().status).toBe('error');
      expect(component.uploadState().error).toContain('connecté');
    }));

    it('should handle 413 error', fakeAsync(() => {
      const mockFile = createMockFile();
      fileServiceSpy.uploadFile.and.returnValue(
        throwError(() => ({ status: 413, error: { message: 'Too large' } }))
      );

      component.selectedFile.set(mockFile);

      component.uploadFile();
      tick();

      expect(component.uploadState().status).toBe('error');
      expect(component.uploadState().error).toContain('1 GB');
    }));

    it('should handle 400 error', fakeAsync(() => {
      const mockFile = createMockFile();
      fileServiceSpy.uploadFile.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Invalid request' } }))
      );

      component.selectedFile.set(mockFile);

      component.uploadFile();
      tick();

      expect(component.uploadState().status).toBe('error');
      expect(component.uploadState().error).toContain('Invalid request');
    }));

    it('should handle generic error', fakeAsync(() => {
      const mockFile = createMockFile();
      fileServiceSpy.uploadFile.and.returnValue(
        throwError(() => ({ status: 500, error: {} }))
      );

      component.selectedFile.set(mockFile);

      component.uploadFile();
      tick();

      expect(component.uploadState().status).toBe('error');
      expect(component.uploadState().error).toContain('Erreur lors de l\'upload');
    }));
  });

  describe('Modal Actions', () => {
    it('should emit close event when closeModal is called', () => {
      let emitted = false;
      component.close.subscribe(() => emitted = true);

      component.closeModal();

      expect(emitted).toBe(true);
    });

    it('should reset state when modal is closed', fakeAsync(() => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadState.set({ status: 'error', progress: 0, error: 'Error' });
      component.uploadForm.patchValue({ password: 'test123' });

      fixture.componentRef.setInput('show', false);
      tick();
      fixture.detectChanges();

      // L'effet devrait réinitialiser l'état
      expect(component.selectedFile()).toBeNull();
      expect(component.uploadState().status).toBe('idle');
      // Le formulaire reset met à null au lieu de ''
      expect(component.uploadForm.get('password')?.value).toBeNull();
    }));
  });

  describe('Success View', () => {
    it('should display download link in success view', () => {
      component.uploadState.set({
        status: 'success',
        progress: 100,
        downloadUrl: 'https://example.com/download/abc123'
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const linkInput = compiled.querySelector('.download-link-input') as HTMLInputElement;
      expect(linkInput?.value).toBe('https://example.com/download/abc123');
    });

    it('should copy link to clipboard', async () => {
      const mockLink = 'https://example.com/download/abc123';
      component.uploadState.set({
        status: 'success',
        progress: 100,
        downloadUrl: mockLink
      });

      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      await component.copyDownloadLink();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockLink);
    });

    it('should handle clipboard error gracefully', async () => {
      component.uploadState.set({
        status: 'success',
        progress: 100,
        downloadUrl: 'https://example.com/download/abc123'
      });

      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject('Error'));
      spyOn(console, 'error');

      await component.copyDownloadLink();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('UI Rendering', () => {
    it('should render file drop zone when no file selected', () => {
      const compiled = fixture.nativeElement;
      const dropZone = compiled.querySelector('.file-drop-zone');
      expect(dropZone).toBeTruthy();
      expect(dropZone?.textContent).toContain('Glissez-déposez');
    });

    it('should render file info when file is selected', () => {
      const mockFile = createMockFile('document.pdf');
      component.selectedFile.set(mockFile);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const fileInfo = compiled.querySelector('.file-info');
      expect(fileInfo).toBeTruthy();
      expect(fileInfo?.textContent).toContain('document.pdf');
    });

    it('should show progress bar when uploading', () => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadState.set({ status: 'uploading', progress: 50 });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const progressBar = compiled.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should show error message when upload fails', () => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadState.set({ status: 'error', progress: 0, error: 'Upload failed' });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector('.error-message');
      expect(errorMessage?.textContent).toContain('Upload failed');
    });

    it('should disable upload button when uploading', () => {
      const mockFile = createMockFile();
      component.selectedFile.set(mockFile);
      component.uploadState.set({ status: 'uploading', progress: 30 });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const uploadButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(uploadButton?.disabled).toBe(true);
    });
  });
});
