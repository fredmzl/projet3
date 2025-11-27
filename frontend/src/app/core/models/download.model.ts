/**
 * Réponse API GET /api/download/{token}
 * Contient les métadonnées du fichier sans le télécharger
 */
export interface FileInfoResponse {
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  expirationDate: string;
  isExpired: boolean;
  hasPassword: boolean;
  message?: string;
}

/**
 * Request body pour POST /api/download/{token}
 * Contient le mot de passe si le fichier est protégé
 */
export interface FileDownloadRequest {
  password?: string;
}

/**
 * Réponse d'erreur de l'API
 */
export interface ErrorResponse {
  error: string;
  message: string;
  expirationDate?: string;
  timestamp?: string;
}
