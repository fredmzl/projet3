export interface FileModel {
  id: string; // UUID
  filename: string;
  fileSize: number; // Long is a number
  downloadToken: string;
  downloadUrl: string;
  expirationDate: Date;
  hasPassword: boolean;
  createdAt: Date;
  isExpired?: boolean;
}
