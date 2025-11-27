import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileInfoResponse, FileDownloadRequest } from '../models/download.model';

/**
 * Service pour gérer le téléchargement de fichiers via lien public
 * US01 - Téléchargement via lien
 */
@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private apiUrl = `${environment.apiUrl}/download`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les informations d'un fichier sans le télécharger
   * GET /api/download/{token}
   * 
   * @param token Token de téléchargement (UUID)
   * @returns Observable avec les métadonnées du fichier
   */
  getFileInfo(token: string): Observable<FileInfoResponse> {
    return this.http.get<FileInfoResponse>(`${this.apiUrl}/${token}`);
  }

  /**
   * Télécharge un fichier avec mot de passe optionnel
   * POST /api/download/{token}
   * 
   * @param token Token de téléchargement
   * @param password Mot de passe optionnel si le fichier est protégé
   */
  downloadFile(token: string, password?: string): Observable<Blob> {
    const body: FileDownloadRequest = password ? { password } : {};
    
    return this.http.post(`${this.apiUrl}/${token}`, body, {
      responseType: 'blob', // Important pour récupérer le fichier binaire
      observe: 'body'
    });
  }

  /**
   * Utilitaire pour sauvegarder le Blob téléchargé
   * Déclenche le téléchargement dans le navigateur
   * 
   * @param blob Données binaires du fichier
   * @param filename Nom du fichier à sauvegarder
   */
  saveFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formate la taille du fichier en format humain (Ko, Mo, Go)
   * 
   * @param bytes Taille en octets
   * @returns Chaîne formatée (ex: "2,6 Mo")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 octet';
    
    const k = 1024;
    const sizes = ['octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  }

  /**
   * Calcule les jours restants avant expiration
   * 
   * @param expirationDate Date d'expiration ISO
   * @returns Nombre de jours restants (arrondi)
   */
  getDaysUntilExpiration(expirationDate: string): number {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
