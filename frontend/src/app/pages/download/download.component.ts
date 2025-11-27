import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DownloadService } from '../../core/services/download.service';
import { FileInfoResponse } from '../../core/models/download.model';

/**
 * Composant de téléchargement de fichier via lien public
 * US01 - Téléchargement via lien
 * 
 * Accessible sans authentification via /download/{token}
 */
@Component({
  selector: 'app-download',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './download.component.html',
  styleUrl: './download.component.css'
})
export class DownloadComponent implements OnInit {
  token: string = '';
  fileInfo: FileInfoResponse | null = null;
  downloadForm: FormGroup;
  
  // États du composant
  loading = true;
  downloading = false;
  error: string | null = null;
  
  // Informations formatées
  formattedSize = '';
  daysUntilExpiration = 0;
  expirationMessage = '';

  constructor(
    private route: ActivatedRoute,
    private downloadService: DownloadService,
    private fb: FormBuilder
  ) {
    this.downloadForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.error = 'Token de téléchargement invalide';
      this.loading = false;
      return;
    }

    this.loadFileInfo();
  }

  /**
   * Charge les informations du fichier
   */
  loadFileInfo(): void {
    this.loading = true;
    this.error = null;

    this.downloadService.getFileInfo(this.token).subscribe({
      next: (info) => {
        this.fileInfo = info;
        this.formattedSize = this.downloadService.formatFileSize(info.fileSize);
        this.daysUntilExpiration = this.downloadService.getDaysUntilExpiration(info.expirationDate);
        this.expirationMessage = this.getExpirationMessage();
        this.loading = false;
        
        // Si le fichier est expiré, afficher l'erreur
        if (info.isExpired) {
          this.error = `Ce fichier n'est plus disponible en téléchargement car il a expiré le ${this.formatDate(info.expirationDate)}.`;
        }
      },
      error: (err) => {
        this.loading = false;
        this.handleError(err);
      }
    });
  }

  /**
   * Télécharge le fichier
   */
  onDownload(): void {
    if (!this.fileInfo || this.fileInfo.isExpired) {
      return;
    }

    // Vérifier le mot de passe si nécessaire
    if (this.fileInfo.hasPassword && this.downloadForm.invalid) {
      this.downloadForm.markAllAsTouched();
      return;
    }

    this.downloading = true;
    this.error = null;

    const password = this.fileInfo.hasPassword ? this.downloadForm.value.password : undefined;

    this.downloadService.downloadFile(this.token, password).subscribe({
      next: (blob) => {
        // Sauvegarder le fichier
        this.downloadService.saveFile(blob, this.fileInfo!.originalFilename);
        this.downloading = false;
      },
      error: (err) => {
        this.downloading = false;
        this.handleDownloadError(err);
      }
    });
  }

  /**
   * Génère le message d'expiration
   */
  private getExpirationMessage(): string {
    if (this.daysUntilExpiration <= 0) {
      return 'Ce fichier a expiré';
    } else if (this.daysUntilExpiration === 1) {
      return 'Ce fichier expirera demain';
    } else {
      return `Ce fichier expirera dans ${this.daysUntilExpiration} jours`;
    }
  }

  /**
   * Formate une date ISO en format français
   */
  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Gère les erreurs de chargement des informations
   */
  private handleError(err: any): void {
    if (err.status === 404) {
      this.error = 'Ce lien de téléchargement n\'existe pas ou n\'est plus valide.';
    } else if (err.status === 410) {
      this.error = 'Ce fichier n\'est plus disponible en téléchargement car il a expiré.';
    } else {
      this.error = 'Une erreur est survenue lors du chargement des informations du fichier.';
    }
  }

  /**
   * Gère les erreurs de téléchargement
   */
  private handleDownloadError(err: any): void {
    if (err.status === 401) {
      this.error = 'Mot de passe incorrect. Veuillez réessayer.';
    } else if (err.status === 404) {
      this.error = 'Ce fichier n\'existe plus.';
    } else if (err.status === 410) {
      this.error = 'Ce fichier a expiré et ne peut plus être téléchargé.';
    } else {
      this.error = 'Une erreur est survenue lors du téléchargement du fichier.';
    }
  }

  /**
   * Getters pour le template
   */
  get passwordControl() {
    return this.downloadForm.get('password');
  }

  get showPasswordError(): boolean {
    const control = this.passwordControl;
    return !!(control && control.invalid && control.touched);
  }
}
