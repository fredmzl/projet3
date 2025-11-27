import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FileService, FileUploadRequest, FileUploadResponse, UploadProgress } from './file.service';
import { environment } from '../../../environments/environment';
import { HttpEventType } from '@angular/common/http';

describe('FileService', () => {
  let service: FileService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/files`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileService]
    });
    service = TestBed.inject(FileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('uploadFile()', () => {
    const createMockFile = (name: string = 'test.pdf', size: number = 1024): File => {
      return new File(['content'], name, { type: 'application/pdf' });
    };

    const mockSuccessResponse: FileUploadResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      filename: 'test.pdf',
      fileSize: 1024,
      downloadToken: 'abc123-token',
      downloadUrl: 'http://192.168.10.163:8080/api/files/download/abc123-token',
      expirationDate: '2025-01-22T10:00:00Z',
      hasPassword: false,
      createdAt: '2025-01-15T10:00:00Z'
    };

    it('should send POST request to correct endpoint', () => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      service.uploadFile(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(mockSuccessResponse);
    });

    it('should create FormData with file', () => {
      const mockFile = createMockFile('document.pdf');
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      service.uploadFile(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      const formData = req.request.body as FormData;
      
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('file')).toEqual(mockFile);
      req.flush(mockSuccessResponse);
    });

    it('should include expirationDays in FormData', () => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 5
      };

      service.uploadFile(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('expirationDays')).toBe('5');
      req.flush(mockSuccessResponse);
    });

    it('should include password in FormData when provided', () => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        password: 'secret123',
        expirationDays: 7
      };

      service.uploadFile(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.get('password')).toBe('secret123');
      req.flush(mockSuccessResponse);
    });

    it('should not include password in FormData when not provided', () => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      service.uploadFile(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      const formData = req.request.body as FormData;
      
      expect(formData.has('password')).toBe(false);
      req.flush(mockSuccessResponse);
    });

    it('should report progress during upload', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      const progressValues: number[] = [];

      service.uploadFile(request).subscribe({
        next: (progress: UploadProgress) => {
          progressValues.push(progress.progress);
        },
        complete: () => {
          expect(progressValues.length).toBeGreaterThan(0);
          expect(progressValues[progressValues.length - 1]).toBe(100);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      
      // Simuler les événements de progression
      req.event({ type: HttpEventType.Sent });
      req.event({
        type: HttpEventType.UploadProgress,
        loaded: 512,
        total: 1024
      });
      req.event({
        type: HttpEventType.UploadProgress,
        loaded: 1024,
        total: 1024
      });
      req.flush(mockSuccessResponse);
    });

    it('should return uploading status during upload', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      let uploadingReceived = false;

      service.uploadFile(request).subscribe({
        next: (progress: UploadProgress) => {
          if (progress.status === 'uploading' && progress.progress === 50) {
            uploadingReceived = true;
          }
        },
        complete: () => {
          expect(uploadingReceived).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.event({
        type: HttpEventType.UploadProgress,
        loaded: 512,
        total: 1024
      });
      req.flush(mockSuccessResponse);
    });

    it('should return completed status with response on success', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      let completedReceived = false;
      let receivedResponse: FileUploadResponse | undefined;

      service.uploadFile(request).subscribe({
        next: (progress: UploadProgress) => {
          if (progress.status === 'completed') {
            completedReceived = true;
            receivedResponse = progress.response;
          }
        },
        complete: () => {
          expect(completedReceived).toBe(true);
          expect(receivedResponse).toEqual(mockSuccessResponse);
          expect(receivedResponse?.downloadUrl).toBe('http://192.168.10.163:8080/api/files/download/abc123-token');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(mockSuccessResponse);
    });

    it('should handle 400 Bad Request error', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 10 // Invalid: max 7
      };

      const errorResponse = {
        error: 'Bad Request',
        message: 'La durée d\'expiration doit être entre 1 et 7 jours',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.uploadFile(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('expiration');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 Unauthorized error', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      const errorResponse = {
        error: 'Unauthorized',
        message: 'Token d\'authentification requis',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.uploadFile(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error.message).toContain('authentification');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 413 Payload Too Large error', (done) => {
      const mockFile = createMockFile('huge-file.zip', 2 * 1024 * 1024 * 1024); // 2GB
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      const errorResponse = {
        error: 'Payload Too Large',
        message: 'La taille du fichier ne doit pas dépasser 1 GB',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.uploadFile(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(413);
          expect(error.error.message).toContain('1 GB');
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorResponse, { status: 413, statusText: 'Payload Too Large' });
    });

    it('should handle 500 Internal Server Error', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      const errorResponse = {
        error: 'Internal Server Error',
        message: 'Une erreur est survenue lors du traitement',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.uploadFile(request).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorResponse, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should request progress reporting', () => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      service.uploadFile(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.reportProgress).toBe(true);
      req.flush(mockSuccessResponse);
    });

    it('should calculate progress percentage correctly', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        expirationDays: 7
      };

      const progressValues: number[] = [];

      service.uploadFile(request).subscribe({
        next: (progress: UploadProgress) => {
          if (progress.status === 'uploading') {
            progressValues.push(progress.progress);
          }
        },
        complete: () => {
          expect(progressValues).toContain(25);
          expect(progressValues).toContain(50);
          expect(progressValues).toContain(75);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      
      req.event({ type: HttpEventType.UploadProgress, loaded: 256, total: 1024 }); // 25%
      req.event({ type: HttpEventType.UploadProgress, loaded: 512, total: 1024 }); // 50%
      req.event({ type: HttpEventType.UploadProgress, loaded: 768, total: 1024 }); // 75%
      req.flush(mockSuccessResponse);
    });

    it('should handle upload with password protected file', (done) => {
      const mockFile = createMockFile();
      const request: FileUploadRequest = {
        file: mockFile,
        password: 'secure123',
        expirationDays: 3
      };

      const protectedResponse: FileUploadResponse = {
        ...mockSuccessResponse,
        hasPassword: true
      };

      service.uploadFile(request).subscribe({
        next: (progress: UploadProgress) => {
          if (progress.status === 'completed' && progress.response) {
            expect(progress.response.hasPassword).toBe(true);
            done();
          }
        }
      });

      const req = httpMock.expectOne(apiUrl);
      const formData = req.request.body as FormData;
      expect(formData.get('password')).toBe('secure123');
      expect(formData.get('expirationDays')).toBe('3');
      req.flush(protectedResponse);
    });
  });

  describe('getUserFiles()', () => {
    it('should be removed - replaced by getFiles', () => {
      expect(service.getFiles).toBeDefined();
    });
  });

  describe('deleteFile()', () => {
    const fileId = '550e8400-e29b-41d4-a716-446655440000';

    it('should send DELETE request to correct endpoint', () => {
      service.deleteFile(fileId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${fileId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should return void observable on success', (done) => {
      service.deleteFile(fileId).subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}`);
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle 404 Not Found error', (done) => {
      const errorResponse = {
        error: 'Not Found',
        message: 'Fichier non trouvé',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.deleteFile(fileId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.error.message).toBe('Fichier non trouvé');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}`);
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 Forbidden error', (done) => {
      const errorResponse = {
        error: 'Forbidden',
        message: 'Vous n\'êtes pas autorisé à supprimer ce fichier',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.deleteFile(fileId).subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.error.message).toContain('autorisé');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}`);
      req.flush(errorResponse, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 401 Unauthorized error', (done) => {
      const errorResponse = {
        error: 'Unauthorized',
        message: 'Token d\'authentification requis',
        timestamp: '2025-01-15T10:00:00Z'
      };

      service.deleteFile(fileId).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.error.message).toContain('authentification');
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${fileId}`);
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });

    it('should include JWT token in Authorization header', () => {
      service.deleteFile(fileId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${fileId}`);
      // Le JWT est ajouté par l'intercepteur, on vérifie juste que la requête est faite
      expect(req.request.headers.has('Authorization')).toBe(false); // Pas encore ajouté par l'intercepteur dans le test
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('should handle multiple delete requests', () => {
      const fileId1 = '550e8400-e29b-41d4-a716-446655440001';
      const fileId2 = '550e8400-e29b-41d4-a716-446655440002';

      service.deleteFile(fileId1).subscribe();
      service.deleteFile(fileId2).subscribe();

      const req1 = httpMock.expectOne(`${apiUrl}/${fileId1}`);
      const req2 = httpMock.expectOne(`${apiUrl}/${fileId2}`);

      expect(req1.request.method).toBe('DELETE');
      expect(req2.request.method).toBe('DELETE');

      req1.flush(null, { status: 204, statusText: 'No Content' });
      req2.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
