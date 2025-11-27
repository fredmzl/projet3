import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileCardComponent } from './file-card.component';
import { FileMetadata } from '../../../core/models/file.model';

describe('FileCardComponent', () => {
  let component: FileCardComponent;
  let fixture: ComponentFixture<FileCardComponent>;

  const mockFile: FileMetadata = {
    id: 'file-123',
    filename: 'test-document.pdf',
    fileSize: 1024000,
    downloadUrl: '/download/token123',
    downloadToken: 'token123',
    expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 jours
    isExpired: false,
    hasPassword: false,
    createdAt: new Date().toISOString(),
    mimeType: 'application/pdf'
  };

  const mockExpiredFile: FileMetadata = {
    id: 'file-456',
    filename: 'old-file.txt',
    fileSize: 2048,
    downloadUrl: '/download/token456',
    downloadToken: 'token456',
    expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // hier
    isExpired: true,
    hasPassword: true,
    createdAt: new Date().toISOString(),
    mimeType: 'text/plain'
  };

  const mockExpiringSoonFile: FileMetadata = {
    id: 'file-789',
    filename: 'expiring.docx',
    fileSize: 5120,
    downloadUrl: '/download/token789',
    downloadToken: 'token789',
    expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 jours
    isExpired: false,
    hasPassword: false,
    createdAt: new Date().toISOString(),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FileCardComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      component.file = mockFile;
      fixture.detectChanges();
      
      expect(component).toBeTruthy();
    });

    it('should require file input', () => {
      expect(() => {
        fixture.detectChanges();
      }).toThrow();
    });
  });

  describe('Expiration Status', () => {
    it('should return "active" status for file expiring in 5+ days', () => {
      component.file = mockFile;
      fixture.detectChanges();

      expect(component.expirationStatus).toBe('active');
    });

    it('should return "expiring-soon" status for file expiring in 2 days', () => {
      component.file = mockExpiringSoonFile;
      fixture.detectChanges();

      expect(component.expirationStatus).toBe('expiring-soon');
    });

    it('should return "expired" status for expired file', () => {
      component.file = mockExpiredFile;
      fixture.detectChanges();

      expect(component.expirationStatus).toBe('expired');
    });
  });

  describe('Expiration Text', () => {
    it('should display "Expiré" for expired file', () => {
      component.file = mockExpiredFile;
      fixture.detectChanges();

      expect(component.expirationText).toBe('Expiré');
    });

    it('should display days until expiration for active file', () => {
      component.file = mockFile;
      fixture.detectChanges();

      expect(component.expirationText).toContain('Expire dans');
      expect(component.expirationText).toContain('jours');
    });

    it('should display "Expire dans 2 jours" for file expiring soon', () => {
      component.file = mockExpiringSoonFile;
      fixture.detectChanges();

      expect(component.expirationText).toBe('Expire dans 2 jours');
    });

    it('should display "Expire demain" for file expiring tomorrow', () => {
      const tomorrowFile = {
        ...mockFile,
        expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      component.file = tomorrowFile;
      fixture.detectChanges();

      expect(component.expirationText).toBe('Expire demain');
    });

    it('should display "Expire aujourd\'hui" for file expiring today', () => {
      // Math.ceil with positive value gives at least 1, so we need a very small positive value
      // that becomes 0 after division and ceil, or negative value that becomes 0 after ceil
      // Actually, Math.ceil(-0.5) = 0, so we need expiration in the past but within same day
      const now = new Date();
      // Set expiration to 12 hours ago - this will give negative days which ceil to 0
      const expirationDate = new Date(now.getTime() - (12 * 60 * 60 * 1000));
      const todayFile = {
        ...mockFile,
        expirationDate: expirationDate.toISOString(),
        isExpired: false
      };
      component.file = todayFile;
      fixture.detectChanges();

      expect(component.expirationText).toBe('Expire aujourd\'hui');
    });
  });

  describe('Badge Class', () => {
    it('should return "badge--success" for active file', () => {
      component.file = mockFile;
      fixture.detectChanges();

      expect(component.expirationBadgeClass).toBe('badge--success');
    });

    it('should return "badge--warning" for expiring soon file', () => {
      component.file = mockExpiringSoonFile;
      fixture.detectChanges();

      expect(component.expirationBadgeClass).toBe('badge--warning');
    });

    it('should return "badge--error" for expired file', () => {
      component.file = mockExpiredFile;
      fixture.detectChanges();

      expect(component.expirationBadgeClass).toBe('badge--error');
    });
  });

  describe('File Icon', () => {
    it('should return "picture_as_pdf" for PDF file', () => {
      component.file = mockFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('picture_as_pdf');
    });

    it('should return "insert_drive_file" for file without mimeType', () => {
      const fileWithoutMime = { ...mockFile, mimeType: undefined };
      component.file = fileWithoutMime;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('insert_drive_file');
    });

    it('should return "description" for Word document', () => {
      component.file = mockExpiringSoonFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('description');
    });

    it('should return "image" for image file', () => {
      const imageFile = { ...mockFile, mimeType: 'image/png' };
      component.file = imageFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('image');
    });

    it('should return "movie" for video file', () => {
      const videoFile = { ...mockFile, mimeType: 'video/mp4' };
      component.file = videoFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('movie');
    });

    it('should return "audiotrack" for audio file', () => {
      const audioFile = { ...mockFile, mimeType: 'audio/mpeg' };
      component.file = audioFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('audiotrack');
    });

    it('should return "folder_zip" for zip file', () => {
      const zipFile = { ...mockFile, mimeType: 'application/zip' };
      component.file = zipFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('folder_zip');
    });

    it('should return "table_chart" for Excel file', () => {
      const excelFile = { ...mockFile, mimeType: 'application/vnd.ms-excel' };
      component.file = excelFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('table_chart');
    });

    it('should return "slideshow" for PowerPoint file', () => {
      const pptFile = { ...mockFile, mimeType: 'application/vnd.ms-powerpoint' };
      component.file = pptFile;
      fixture.detectChanges();

      expect(component.fileIcon).toBe('slideshow');
    });
  });

  describe('Event Emitters', () => {
    it('should emit download event when onDownload is called', () => {
      component.file = mockFile;
      fixture.detectChanges();
      
      spyOn(component.download, 'emit');

      component.onDownload();

      expect(component.download.emit).toHaveBeenCalledWith(mockFile);
    });

    it('should emit delete event when onDelete is called', () => {
      component.file = mockFile;
      fixture.detectChanges();
      
      spyOn(component.delete, 'emit');

      component.onDelete();

      expect(component.delete.emit).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('Template Rendering', () => {
    it('should display filename', () => {
      component.file = mockFile;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const filename = compiled.querySelector('.file-row__name');
      
      expect(filename?.textContent?.trim()).toContain('test-document.pdf');
    });

    it('should display lock icon for password-protected file', () => {
      component.file = mockExpiredFile;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const lockIcon = compiled.querySelector('.file-row__lock');
      
      expect(lockIcon?.textContent?.trim()).toBe('lock');
    });

    it('should have download button', () => {
      component.file = mockFile;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      const downloadBtn = Array.from(buttons).find((btn: any) => 
        btn.textContent?.includes('Accéder')
      );
      
      expect(downloadBtn).toBeTruthy();
    });

    it('should have delete button', () => {
      component.file = mockFile;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('button');
      const deleteBtn = Array.from(buttons).find((btn: any) => 
        btn.textContent?.includes('Supprimer')
      );
      
      expect(deleteBtn).toBeTruthy();
    });
  });
});
