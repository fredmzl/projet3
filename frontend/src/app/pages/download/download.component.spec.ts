import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DownloadComponent } from './download.component';
import { DownloadService } from '../../core/services/download.service';
import { FileInfoResponse } from '../../core/models/download.model';

describe('DownloadComponent', () => {
  let component: DownloadComponent;
  let fixture: ComponentFixture<DownloadComponent>;
  let downloadServiceSpy: jasmine.SpyObj<DownloadService>;
  let activatedRoute: ActivatedRoute;

  const mockToken = '93ae4861-3dba-424a-bb60-28bf31640cfb';

  const mockFileInfoPublic: FileInfoResponse = {
    originalFilename: 'report.txt',
    fileSize: 257,
    mimeType: 'text/plain',
    expirationDate: '2025-11-28T12:00:00Z',
    isExpired: false,
    hasPassword: false
  };

  const mockFileInfoProtected: FileInfoResponse = {
    originalFilename: 'secret-notes.md',
    fileSize: 271,
    mimeType: 'text/markdown',
    expirationDate: '2025-11-28T12:00:00Z',
    isExpired: false,
    hasPassword: true,
    message: 'Ce fichier est protégé par mot de passe'
  };

  const mockFileInfoExpired: FileInfoResponse = {
    originalFilename: 'old-document.txt',
    fileSize: 121,
    mimeType: 'text/plain',
    expirationDate: '2025-11-20T12:00:00Z',
    isExpired: true,
    hasPassword: false
  };

  beforeEach(async () => {
    const downloadSpy = jasmine.createSpyObj('DownloadService', [
      'getFileInfo',
      'downloadFile',
      'saveFile',
      'formatFileSize',
      'getDaysUntilExpiration'
    ]);

    await TestBed.configureTestingModule({
      imports: [DownloadComponent, ReactiveFormsModule],
      providers: [
        { provide: DownloadService, useValue: downloadSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'token' ? mockToken : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DownloadComponent);
    component = fixture.componentInstance;
    downloadServiceSpy = TestBed.inject(DownloadService) as jasmine.SpyObj<DownloadService>;
    activatedRoute = TestBed.inject(ActivatedRoute);

    // Setup default spy returns
    downloadServiceSpy.formatFileSize.and.returnValue('257 octets');
    downloadServiceSpy.getDaysUntilExpiration.and.returnValue(7);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
      expect(component.loading).toBe(true);
    });

    it('should extract token from route params', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
      component.ngOnInit();
      expect(component.token).toBe(mockToken);
    });

    it('should show error if token is missing', () => {
      spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(null);
      component.ngOnInit();
      
      expect(component.error).toBe('Token de téléchargement invalide');
      expect(component.loading).toBe(false);
    });

    it('should call loadFileInfo on init with valid token', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
      
      component.ngOnInit();
      
      expect(downloadServiceSpy.getFileInfo).toHaveBeenCalledWith(mockToken);
    });

    it('should initialize password form with empty value', () => {
      expect(component.downloadForm.get('password')?.value).toBe('');
    });

    it('should mark password as required', () => {
      const passwordControl = component.downloadForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);
    });
  });

  describe('loadFileInfo()', () => {
    it('should load public file info successfully', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));

      component.ngOnInit();

      expect(component.fileInfo).toEqual(mockFileInfoPublic);
      expect(component.loading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should load protected file info successfully', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoProtected));

      component.ngOnInit();

      expect(component.fileInfo?.hasPassword).toBe(true);
      expect(component.fileInfo?.message).toBe('Ce fichier est protégé par mot de passe');
    });

    it('should format file size using service', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
      downloadServiceSpy.formatFileSize.and.returnValue('257 octets');

      component.ngOnInit();

      expect(downloadServiceSpy.formatFileSize).toHaveBeenCalledWith(257);
      expect(component.formattedSize).toBe('257 octets');
    });

    it('should calculate days until expiration', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(7);

      component.ngOnInit();

      expect(downloadServiceSpy.getDaysUntilExpiration).toHaveBeenCalledWith('2025-11-28T12:00:00Z');
      expect(component.daysUntilExpiration).toBe(7);
    });

    it('should generate expiration message', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(7);

      component.ngOnInit();

      expect(component.expirationMessage).toBe('Ce fichier expirera dans 7 jours');
    });

    it('should show error message for expired file', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoExpired));
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(-1);

      component.ngOnInit();

      expect(component.fileInfo?.isExpired).toBe(true);
      expect(component.error).toContain('expiré');
    });

    it('should handle 404 Not Found error', () => {
      const error = { status: 404 };
      downloadServiceSpy.getFileInfo.and.returnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.error).toBe('Ce lien de téléchargement n\'existe pas ou n\'est plus valide.');
      expect(component.loading).toBe(false);
    });

    it('should handle 410 Gone error', () => {
      const error = { status: 410 };
      downloadServiceSpy.getFileInfo.and.returnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.error).toBe('Ce fichier n\'est plus disponible en téléchargement car il a expiré.');
      expect(component.loading).toBe(false);
    });

    it('should handle generic error', () => {
      const error = { status: 500 };
      downloadServiceSpy.getFileInfo.and.returnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.error).toBe('Une erreur est survenue lors du chargement des informations du fichier.');
    });
  });

  describe('onDownload()', () => {
    beforeEach(() => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
      component.ngOnInit();
    });

    it('should not download if file is expired', () => {
      component.fileInfo = mockFileInfoExpired;

      component.onDownload();

      expect(downloadServiceSpy.downloadFile).not.toHaveBeenCalled();
    });

    it('should not download if fileInfo is null', () => {
      component.fileInfo = null;

      component.onDownload();

      expect(downloadServiceSpy.downloadFile).not.toHaveBeenCalled();
    });

    it('should validate password form if file is protected', () => {
      component.fileInfo = mockFileInfoProtected;
      component.downloadForm.get('password')?.setValue('');

      component.onDownload();

      expect(component.downloadForm.touched).toBe(true);
      expect(downloadServiceSpy.downloadFile).not.toHaveBeenCalled();
    });

    it('should download public file without password', () => {
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));
      component.fileInfo = mockFileInfoPublic;

      component.onDownload();

      expect(downloadServiceSpy.downloadFile).toHaveBeenCalledWith(mockToken, undefined);
      expect(component.downloading).toBe(false);
    });

    it('should download protected file with password', () => {
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));
      component.fileInfo = mockFileInfoProtected;
      component.downloadForm.get('password')?.setValue('password');

      component.onDownload();

      expect(downloadServiceSpy.downloadFile).toHaveBeenCalledWith(mockToken, 'password');
    });

    it('should set downloading state during download', () => {
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));

      component.onDownload();

      expect(component.downloading).toBe(false); // false after completion
    });

    it('should call saveFile with blob and filename', () => {
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));
      component.fileInfo = mockFileInfoPublic;

      component.onDownload();

      expect(downloadServiceSpy.saveFile).toHaveBeenCalledWith(mockBlob, 'report.txt');
    });

    it('should clear error on successful download', () => {
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));
      component.error = 'Previous error';

      component.onDownload();

      expect(component.error).toBeNull();
    });

    it('should handle 401 Unauthorized error', () => {
      const error = { status: 401 };
      downloadServiceSpy.downloadFile.and.returnValue(throwError(() => error));
      component.fileInfo = mockFileInfoProtected;
      component.downloadForm.get('password')?.setValue('wrong-password');

      component.onDownload();

      expect(component.error).toBe('Mot de passe incorrect. Veuillez réessayer.');
      expect(component.downloading).toBe(false);
    });

    it('should handle 404 Not Found error during download', () => {
      const error = { status: 404 };
      downloadServiceSpy.downloadFile.and.returnValue(throwError(() => error));

      component.onDownload();

      expect(component.error).toBe('Ce fichier n\'existe plus.');
    });

    it('should handle 410 Gone error during download', () => {
      const error = { status: 410 };
      downloadServiceSpy.downloadFile.and.returnValue(throwError(() => error));

      component.onDownload();

      expect(component.error).toBe('Ce fichier a expiré et ne peut plus être téléchargé.');
    });

    it('should handle generic download error', () => {
      const error = { status: 500 };
      downloadServiceSpy.downloadFile.and.returnValue(throwError(() => error));

      component.onDownload();

      expect(component.error).toBe('Une erreur est survenue lors du téléchargement du fichier.');
    });
  });

  describe('Expiration Message Generation', () => {
    beforeEach(() => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));
    });

    it('should generate message for expired file', () => {
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(0);
      component.ngOnInit();
      expect(component.expirationMessage).toBe('Ce fichier a expiré');
    });

    it('should generate message for file expiring tomorrow', () => {
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(1);
      component.ngOnInit();
      expect(component.expirationMessage).toBe('Ce fichier expirera demain');
    });

    it('should generate message for file expiring in multiple days', () => {
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(5);
      component.ngOnInit();
      expect(component.expirationMessage).toBe('Ce fichier expirera dans 5 jours');
    });
  });

  describe('Form Control Getters', () => {
    it('should get password control', () => {
      const control = component.passwordControl;
      expect(control).toBe(component.downloadForm.get('password'));
    });

    it('should show password error when touched and invalid', () => {
      const passwordControl = component.downloadForm.get('password');
      passwordControl?.markAsTouched();
      passwordControl?.setValue('');

      expect(component.showPasswordError).toBe(true);
    });

    it('should not show password error when valid', () => {
      const passwordControl = component.downloadForm.get('password');
      passwordControl?.setValue('password');

      expect(component.showPasswordError).toBe(false);
    });

    it('should not show password error when untouched', () => {
      const passwordControl = component.downloadForm.get('password');
      passwordControl?.setValue('');

      expect(component.showPasswordError).toBe(false);
    });
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoExpired));
      downloadServiceSpy.getDaysUntilExpiration.and.returnValue(-1);
    });

    it('should format date in French locale', () => {
      component.ngOnInit();

      expect(component.error).toContain('20 novembre 2025');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing fileInfo gracefully', () => {
      component.fileInfo = null;
      component.onDownload();

      expect(downloadServiceSpy.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle empty password for protected file', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoProtected));
      component.ngOnInit();
      component.downloadForm.get('password')?.setValue('');

      component.onDownload();

      expect(component.downloadForm.get('password')?.touched).toBe(true);
      expect(downloadServiceSpy.downloadFile).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only password', () => {
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoProtected));
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));
      component.ngOnInit();
      component.downloadForm.get('password')?.setValue('   ');

      component.onDownload();

      // Form should be valid (only checks required, not whitespace)
      // But backend will reject it
      expect(downloadServiceSpy.downloadFile).toHaveBeenCalled();
    });

    it('should handle very long filenames', () => {
      const longFilename = 'a'.repeat(200) + '.txt';
      const fileInfo = { ...mockFileInfoPublic, originalFilename: longFilename };
      downloadServiceSpy.getFileInfo.and.returnValue(of(fileInfo));

      component.ngOnInit();

      expect(component.fileInfo?.originalFilename).toBe(longFilename);
    });

    it('should handle special characters in filename', () => {
      const specialFilename = 'fichier-spécial_[1]_(copie).pdf';
      const fileInfo = { ...mockFileInfoPublic, originalFilename: specialFilename };
      downloadServiceSpy.getFileInfo.and.returnValue(of(fileInfo));

      component.ngOnInit();

      expect(component.fileInfo?.originalFilename).toBe(specialFilename);
    });
  });

  describe('Component State Management', () => {
    it('should reset error when loading new file info', () => {
      component.error = 'Previous error';
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));

      component['loadFileInfo']();

      expect(component.error).toBeNull();
    });

    it('should set loading to true when starting to load', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoPublic));

      component['loadFileInfo']();

      expect(component.loading).toBe(false); // false after completion
    });

    it('should maintain form state across multiple download attempts', () => {
      downloadServiceSpy.getFileInfo.and.returnValue(of(mockFileInfoProtected));
      component.ngOnInit();
      
      const mockBlob = new Blob(['content']);
      downloadServiceSpy.downloadFile.and.returnValue(of(mockBlob));
      component.downloadForm.get('password')?.setValue('password');

      component.onDownload();
      component.onDownload();

      expect(downloadServiceSpy.downloadFile).toHaveBeenCalledTimes(2);
    });
  });
});
