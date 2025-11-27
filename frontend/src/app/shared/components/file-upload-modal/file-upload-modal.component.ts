import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../core/services/file.service';
import { catchError, finalize, of } from 'rxjs';

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-file-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule
  ],
  templateUrl: './file-upload-modal.component.html',
  styleUrl: './file-upload-modal.component.css'
})
export class FileUploadModalComponent {
  private fb = inject(FormBuilder);
  private fileService = inject(FileService);

  // Inputs & Outputs
  show = input.required<boolean>();
  close = output<void>();
  uploaded = output<void>();

  // État
  selectedFile = signal<File | null>(null);
  uploadState = signal<UploadState>({ status: 'idle', progress: 0 });
  isDragOver = signal<boolean>(false);

  // Formulaire
  uploadForm = this.fb.group({
    password: ['', [Validators.minLength(6)]],
    expirationDays: [7, [Validators.required, Validators.min(1), Validators.max(7)]]
  });

  // Computed
  fileName = computed(() => this.selectedFile()?.name || 'Aucun fichier sélectionné');
  fileSize = computed(() => {
    const file = this.selectedFile();
    if (!file) return '';
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  });
  canUpload = computed(() => {
    return this.selectedFile() !== null && 
      this.uploadState().status === 'idle' &&
      this.uploadForm.valid;
  });
  isUploading = computed(() => this.uploadState().status === 'uploading');
  isSuccess = computed(() => this.uploadState().status === 'success');
  isError = computed(() => this.uploadState().status === 'error');

  // Options d'expiration
  expirationOptions = [
    { value: 1, label: '1 jour' },
    { value: 2, label: '2 jours' },
    { value: 3, label: '3 jours' },
    { value: 5, label: '5 jours' },
    { value: 7, label: '7 jours' }
  ];

  constructor() {
    // Reset l'état quand le modal est fermé
    effect(() => {
      if (!this.show()) {
        this.resetState();
      }
    });
  }

  /**
   * Gestion du drag & drop
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  /**
   * Sélection de fichier via input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectFile(input.files[0]);
    }
  }

  /**
   * Validation et sélection du fichier
   */
  private selectFile(file: File): void {
    const maxSize = 1024 * 1024 * 1024; // 1 GB
    
    if (file.size > maxSize) {
      this.uploadState.set({
        status: 'error',
        progress: 0,
        error: 'Le fichier ne doit pas dépasser 1 GB'
      });
      return;
    }

    this.selectedFile.set(file);
    this.uploadState.set({ status: 'idle', progress: 0 });
  }

  /**
   * Upload du fichier
   */
  uploadFile(): void {
    const file = this.selectedFile();
    if (!file || !this.uploadForm.valid) return;

    const formValue = this.uploadForm.value;
    this.uploadState.set({ status: 'uploading', progress: 0 });

    this.fileService.uploadFile({
      file,
      password: formValue.password || undefined,
      expirationDays: formValue.expirationDays || 7
    }).pipe(
      catchError((error) => {
        let errorMessage = 'Erreur lors de l\'upload du fichier';
        
        if (error.status === 401) {
          errorMessage = 'Vous devez être connecté pour uploader un fichier';
        } else if (error.status === 413) {
          errorMessage = 'Le fichier ne doit pas dépasser 1 GB';
        } else if (error.status === 400) {
          // Vérifier si c'est une erreur de type MIME
          const errorMsg = error.error?.error || error.error?.message || '';
          if (errorMsg.includes('File type not allowed') || errorMsg.includes('MIME')) {
            errorMessage = `Type de fichier non autorisé : ${file.name}\n\nLes fichiers exécutables et scripts sont bloqués pour des raisons de sécurité (exe, bat, sh, jar, etc.)`;
          } else {
            errorMessage = errorMsg || 'Données invalides';
          }
        }

        this.uploadState.set({
          status: 'error',
          progress: 0,
          error: errorMessage
        });

        return of(null);
      }),
      finalize(() => {
        // L'état final est géré par les événements de progression
      })
    ).subscribe((progress) => {
      if (progress) {
        this.uploadState.update(state => ({
          ...state,
          progress: progress.progress
        }));

        if (progress.status === 'completed' && progress.response) {
          this.uploadState.set({
            status: 'success',
            progress: 100,
            downloadUrl: progress.response.downloadUrl
          });
        }
      }
    });
  }

  /**
   * Copier le lien de téléchargement
   */
  async copyDownloadLink(): Promise<void> {
    const link = this.uploadState().downloadUrl;
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      // TODO: Afficher un toast de confirmation
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  }

  /**
   * Fermer le modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Réinitialiser l'état
   */
  private resetState(): void {
    this.selectedFile.set(null);
    this.uploadState.set({ status: 'idle', progress: 0 });
    this.uploadForm.reset({ expirationDays: 7 });
    this.isDragOver.set(false);
  }
}
