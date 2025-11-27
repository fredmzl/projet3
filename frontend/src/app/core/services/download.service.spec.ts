import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DownloadService } from './download.service';
import { FileInfoResponse, FileDownloadRequest } from '../models/download.model';
import { environment } from '../../../environments/environment';

describe('DownloadService', () => {
  let service: DownloadService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/download`;
  const mockToken = '93ae4861-3dba-424a-bb60-28bf31640cfb';

  const mockFileInfoPublic: FileInfoResponse = {
    originalFilename: 'report.txt',
    fileSize: 257,
    mimeType: 'text/plain',
    expirationDate: '2025-11-28T12:48:43.590361',
    isExpired: false,
    hasPassword: false
  };

  const mockFileInfoProtected: FileInfoResponse = {
    originalFilename: 'secret-notes.md',
    fileSize: 271,
    mimeType: 'text/markdown',
    expirationDate: '2025-11-28T12:48:43.589076',
    isExpired: false,
    hasPassword: true,
    message: 'Ce fichier est protégé par mot de passe'
  };

  const mockFileInfoExpired: FileInfoResponse = {
    originalFilename: 'old-document.txt',
    fileSize: 121,
    mimeType: 'text/plain',
    expirationDate: '2025-11-20T12:48:43.591541',
    isExpired: true,
    hasPassword: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DownloadService]
    });

    service = TestBed.inject(DownloadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have correct API URL', () => {
      expect(service['apiUrl']).toBe(`${environment.apiUrl}/download`);
    });
  });

  describe('getFileInfo()', () => {
    it('should send GET request to /api/download/{token}', () => {
      service.getFileInfo(mockToken).subscribe(response => {
        expect(response).toEqual(mockFileInfoPublic);
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFileInfoPublic);
    });

    it('should return file info for public file', (done) => {
      service.getFileInfo(mockToken).subscribe(response => {
        expect(response.originalFilename).toBe('report.txt');
        expect(response.fileSize).toBe(257);
        expect(response.mimeType).toBe('text/plain');
        expect(response.isExpired).toBe(false);
        expect(response.hasPassword).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.flush(mockFileInfoPublic);
    });

    it('should return file info for protected file', (done) => {
      service.getFileInfo(mockToken).subscribe(response => {
        expect(response.originalFilename).toBe('secret-notes.md');
        expect(response.hasPassword).toBe(true);
        expect(response.message).toBe('Ce fichier est protégé par mot de passe');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.flush(mockFileInfoProtected);
    });

    it('should return file info for expired file', (done) => {
      service.getFileInfo(mockToken).subscribe(response => {
        expect(response.isExpired).toBe(true);
        expect(response.originalFilename).toBe('old-document.txt');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.flush(mockFileInfoExpired);
    });

    it('should handle 404 Not Found error', (done) => {
      service.getFileInfo('invalid-token').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/invalid-token`);
      req.flush({ message: 'Fichier non trouvé' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 410 Gone error (expired file)', (done) => {
      service.getFileInfo(mockToken).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(410);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.flush(
        { message: 'Ce fichier a expiré', expirationDate: '2025-11-20T12:48:43.591541' },
        { status: 410, statusText: 'Gone' }
      );
    });

    it('should handle network errors', (done) => {
      service.getFileInfo(mockToken).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('downloadFile()', () => {
    const mockBlob = new Blob(['file content'], { type: 'text/plain' });

    it('should send POST request to /api/download/{token}', () => {
      service.downloadFile(mockToken).subscribe(response => {
        expect(response).toEqual(mockBlob);
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should download file without password', (done) => {
      service.downloadFile(mockToken).subscribe(response => {
        expect(response instanceof Blob).toBe(true);
        expect(response.size).toBeGreaterThan(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      expect(req.request.body).toEqual({});
      req.flush(mockBlob);
    });

    it('should download file with password', (done) => {
      const password = 'password';

      service.downloadFile(mockToken, password).subscribe(response => {
        expect(response instanceof Blob).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      expect(req.request.body).toEqual({ password: 'password' });
      req.flush(mockBlob);
    });

    it('should handle 401 Unauthorized error (wrong password)', (done) => {
      service.downloadFile(mockToken, 'wrong-password').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.error(new ProgressEvent('error'), { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 404 Not Found error', (done) => {
      service.downloadFile('invalid-token').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/invalid-token`);
      req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
    });

    it('should handle 410 Gone error (expired file)', (done) => {
      service.downloadFile(mockToken).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(410);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      req.error(new ProgressEvent('error'), { status: 410, statusText: 'Gone' });
    });

    it('should send empty body when password is undefined', () => {
      service.downloadFile(mockToken, undefined).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      expect(req.request.body).toEqual({});
      req.flush(mockBlob);
    });
  });

  describe('saveFile()', () => {
    let createElementSpy: jasmine.Spy;
    let appendChildSpy: jasmine.Spy;
    let removeChildSpy: jasmine.Spy;
    let clickSpy: jasmine.Spy;
    let createObjectURLSpy: jasmine.Spy;
    let revokeObjectURLSpy: jasmine.Spy;

    beforeEach(() => {
      const link = document.createElement('a');
      clickSpy = spyOn(link, 'click');
      createElementSpy = spyOn(document, 'createElement').and.returnValue(link);
      appendChildSpy = spyOn(document.body, 'appendChild');
      removeChildSpy = spyOn(document.body, 'removeChild');
      createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
      revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');
    });

    it('should trigger browser download', () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';

      service.saveFile(blob, filename);

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should set correct download attribute', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'document.pdf';

      service.saveFile(blob, filename);

      const link = createElementSpy.calls.mostRecent().returnValue;
      expect(link.download).toBe(filename);
    });

    it('should create object URL for blob', () => {
      const blob = new Blob(['content'], { type: 'application/json' });

      service.saveFile(blob, 'data.json');

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    });

    it('should revoke object URL after download', () => {
      const blob = new Blob(['test']);

      service.saveFile(blob, 'file.txt');

      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('formatFileSize()', () => {
    it('should format 0 bytes', () => {
      expect(service.formatFileSize(0)).toBe('0 octet');
    });

    it('should format bytes (< 1024)', () => {
      expect(service.formatFileSize(500)).toBe('500 octets');
      expect(service.formatFileSize(1023)).toBe('1023 octets');
    });

    it('should format kilobytes', () => {
      expect(service.formatFileSize(1024)).toBe('1 Ko');
      expect(service.formatFileSize(2048)).toBe('2 Ko');
      expect(service.formatFileSize(1536)).toBe('1.5 Ko');
    });

    it('should format megabytes', () => {
      expect(service.formatFileSize(1048576)).toBe('1 Mo');
      expect(service.formatFileSize(2621440)).toBe('2.5 Mo');
      expect(service.formatFileSize(257)).toBe('257 octets');
    });

    it('should format gigabytes', () => {
      expect(service.formatFileSize(1073741824)).toBe('1 Go');
      expect(service.formatFileSize(2147483648)).toBe('2 Go');
    });

    it('should round to 1 decimal place', () => {
      expect(service.formatFileSize(1536)).toBe('1.5 Ko');
      expect(service.formatFileSize(1587)).toBe('1.5 Ko'); // 1.55 rounded to 1.5
    });
  });

  describe('getDaysUntilExpiration()', () => {
    beforeEach(() => {
      // Mock current date to 2025-11-21 12:00:00
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-11-21T12:00:00Z'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should calculate days until expiration (positive)', () => {
      const expirationDate = '2025-11-28T12:00:00Z'; // 7 days from now
      expect(service.getDaysUntilExpiration(expirationDate)).toBe(7);
    });

    it('should calculate days until expiration (tomorrow)', () => {
      const expirationDate = '2025-11-22T12:00:00Z'; // 1 day from now
      expect(service.getDaysUntilExpiration(expirationDate)).toBe(1);
    });

    it('should return 0 for today expiration', () => {
      const expirationDate = '2025-11-21T23:59:59Z'; // later today
      expect(service.getDaysUntilExpiration(expirationDate)).toBe(1);
    });

    it('should return negative for expired files', () => {
      const expirationDate = '2025-11-20T12:00:00Z'; // yesterday
      const result = service.getDaysUntilExpiration(expirationDate);
      expect(result).toBeLessThan(1);
    });

    it('should ceil fractional days', () => {
      const expirationDate = '2025-11-21T18:00:00Z'; // 6 hours from now
      expect(service.getDaysUntilExpiration(expirationDate)).toBe(1);
    });

    it('should handle far future dates', () => {
      const expirationDate = '2025-12-21T12:00:00Z'; // 30 days from now
      expect(service.getDaysUntilExpiration(expirationDate)).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty token', () => {
      service.getFileInfo('').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/`);
      req.flush({ message: 'Invalid token' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle very large file sizes', () => {
      const largeSize = 10737418240; // 10 GB
      const formatted = service.formatFileSize(largeSize);
      expect(formatted).toBe('10 Go');
    });

    it('should handle special characters in filename', () => {
      const blob = new Blob(['test']);
      const filename = 'fichier spécial (1) [test].pdf';

      expect(() => service.saveFile(blob, filename)).not.toThrow();
    });
  });

  describe('HTTP Headers', () => {
    it('should request blob response type for download', () => {
      service.downloadFile(mockToken).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${mockToken}`);
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob());
    });
  });
});
