import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { FileMetadata, getFileExpirationStatus, getDaysUntilExpiration, FileExpirationStatus } from '../../../core/models/file.model';

/**
 * Composant carte pour afficher les informations d'un fichier
 */
@Component({
  selector: 'app-file-card',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    NgClass
  ],
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.css'
})
export class FileCardComponent implements OnInit {
  @Input({ required: true }) file!: FileMetadata;
  @Output() download = new EventEmitter<FileMetadata>();
  @Output() delete = new EventEmitter<FileMetadata>();

  ngOnInit() {
    console.log('FileCardComponent - file data:', this.file);
    console.log('filename:', this.file.filename);
    console.log('mimeType:', this.file.mimeType);
  }

  /**
   * Obtient le statut d'expiration du fichier
   */
  get expirationStatus(): FileExpirationStatus {
    return getFileExpirationStatus(this.file.expirationDate, this.file.isExpired);
  }

  /**
   * Obtient le texte d'expiration à afficher
   */
  get expirationText(): string {
    if (this.file.isExpired) {
      return 'Expiré';
    }

    const days = getDaysUntilExpiration(this.file.expirationDate);
    
    if (days === 0) {
      return 'Expire aujourd\'hui';
    } else if (days === 1) {
      return 'Expire demain';
    } else if (days < 3) {
      return `Expire dans ${days} jours`;
    } else {
      return `Expire dans ${days} jours`;
    }
  }

  /**
   * Obtient la classe CSS pour le badge d'expiration
   */
  get expirationBadgeClass(): string {
    switch (this.expirationStatus) {
      case 'active':
        return 'badge--success';
      case 'expiring-soon':
        return 'badge--warning';
      case 'expired':
        return 'badge--error';
      default:
        return '';
    }
  }

  /**
   * Obtient l'icône pour le type MIME du fichier
   */
  get fileIcon(): string {
    if (!this.file.mimeType) return 'insert_drive_file';
    
    const mimeType = this.file.mimeType.toLowerCase();
    
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'movie';
    if (mimeType.includes('audio')) return 'audiotrack';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'folder_zip';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'slideshow';
    
    return 'insert_drive_file';
  }

  /**
   * Émet l'événement de téléchargement
   */
  onDownload(): void {
    this.download.emit(this.file);
  }

  /**
   * Émet l'événement de suppression
   */
  onDelete(): void {
    this.delete.emit(this.file);
  }
}
