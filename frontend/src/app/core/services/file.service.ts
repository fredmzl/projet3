import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileListResponse, FileListParams } from '../models/file.model';

export interface FileUploadRequest {
  file: File;
  password?: string;
  expirationDays: number;
}

export interface FileMetadata {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  expirationDate: string;
  hasPassword: boolean;
  createdAt: string;
}

// Réponse directe du backend (FileUploadResponseDto)
export interface FileUploadResponse {
  id: string;
  filename: string;
  fileSize: number;
  downloadToken: string;
  downloadUrl: string;
  expirationDate: string;
  hasPassword: boolean;
  createdAt: string;
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed';
  response?: FileUploadResponse;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/files`;

  /**
   * Upload un fichier avec suivi de progression
   * @param request Fichier et métadonnées à uploader
   * @returns Observable avec progression et réponse finale
   */
  uploadFile(request: FileUploadRequest): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('expirationDays', request.expirationDays.toString());
    
    if (request.password) {
      formData.append('password', request.password);
    }

    return this.http.post<FileUploadResponse>(this.apiUrl, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<FileUploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event.total 
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { progress, status: 'uploading' as const };

          case HttpEventType.Response:
            return {
              progress: 100,
              status: 'completed' as const,
              response: event.body!
            };

          default:
            return { progress: 0, status: 'uploading' as const };
        }
      })
    );
  }

  /**
   * Récupère la liste des fichiers de l'utilisateur avec pagination
   * @param params Paramètres de pagination et filtrage
   * @returns Observable avec la liste paginée des fichiers
   */
  getFiles(params?: FileListParams): Observable<FileListResponse> {
    let httpParams = new HttpParams();
    
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params?.includeExpired !== undefined) {
      httpParams = httpParams.set('includeExpired', params.includeExpired.toString());
    }

    return this.http.get<FileListResponse>(this.apiUrl, { params: httpParams });
  }

  /**
   * Supprime un fichier
   * @param fileId UUID du fichier à supprimer
   * @returns Observable vide (204 No Content)
   */
  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${fileId}`);
  }

  downloadFile(token: string, password?: string): Observable<Blob> {
    const body = password ? { password } : {};
    
    return this.http.post(`${environment.apiUrl}/download/${token}`, body, {
      responseType: 'blob'
    });
  }
}
