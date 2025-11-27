/**
 * Métadonnées d'un fichier uploadé (réponse API GET /api/files)
 */
export interface FileMetadata {
  id: string;
  filename: string; // Le backend retourne "filename" au lieu de "originalFilename"
  fileSize: number;
  mimeType?: string; // Optionnel car le backend ne le retourne pas toujours
  downloadUrl: string; // Le backend retourne "downloadUrl" au lieu de "downloadLink"
  downloadToken: string;
  expirationDate: string;
  isExpired: boolean;
  hasPassword: boolean;
  createdAt: string;
}

/**
 * Getter pour avoir originalFilename (alias de filename)
 */
export function getOriginalFilename(file: FileMetadata): string {
  return file.filename;
}

/**
 * Informations de pagination
 */
export interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Réponse de l'API GET /api/files
 */
export interface FileListResponse {
  files: FileMetadata[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Paramètres de requête pour la liste des fichiers
 */
export interface FileListParams {
  page?: number;
  size?: number;
  sort?: string;
  includeExpired?: boolean;
}

/**
 * État d'expiration d'un fichier
 */
export type FileExpirationStatus = 'active' | 'expiring-soon' | 'expired';

/**
 * Filtre pour affichage des fichiers
 */
export type FileFilter = 'all' | 'active' | 'expired';

/**
 * Calcule l'état d'expiration d'un fichier
 */
export function getFileExpirationStatus(expirationDate: string, isExpired: boolean): FileExpirationStatus {
  if (isExpired) {
    return 'expired';
  }

  const expDate = new Date(expirationDate);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 3) {
    return 'expiring-soon';
  }

  return 'active';
}

/**
 * Formate la taille d'un fichier en unités lisibles
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calcule le nombre de jours avant expiration
 */
export function getDaysUntilExpiration(expirationDate: string): number {
  const expDate = new Date(expirationDate);
  const now = new Date();
  const diffMs = expDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
