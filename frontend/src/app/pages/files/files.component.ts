import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { FileService } from '../../core/services/file.service';
import { FileUploadModalComponent } from '../../shared/components/file-upload-modal/file-upload-modal.component';
import { FileCardComponent } from '../../shared/components/file-card/file-card.component';
import { CalloutComponent } from '../../shared/components/callout/callout.component';
import { FileMetadata, FileFilter } from '../../core/models/file.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-files',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatDialogModule,
    FileUploadModalComponent,
    FileCardComponent,
    CalloutComponent
  ],
  templateUrl: './files.component.html',
  styleUrl: './files.component.css'
})
export class FilesComponent implements OnInit {
  authService = inject(AuthService);
  private fileService = inject(FileService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  showUploadModal = signal<boolean>(false);
  files = signal<FileMetadata[]>([]);
  filteredFiles = signal<FileMetadata[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Pagination
  currentPage = signal<number>(0);
  pageSize = signal<number>(20);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  
  // Filtres
  currentFilter = signal<FileFilter>('active');

  // Computed signals pour les compteurs
  activeFilesCount = signal<number>(0);
  expiredFilesCount = signal<number>(0);

  ngOnInit(): void {
    this.loadFiles();
  }

  /**
   * Charge la liste des fichiers depuis l'API
   */
  loadFiles(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.fileService.getFiles({
      page: this.currentPage(),
      size: this.pageSize(),
      sort: 'createdAt,desc',
      includeExpired: true
    }).subscribe({
      next: (response) => {
        console.log('Réponse API /files:', response);
        console.log('Nombre de fichiers reçus:', response.files?.length || 0);
        this.files.set(response.files || []);
        this.totalElements.set(response.totalElements || 0);
        this.totalPages.set(response.totalPages || 0);
        this.currentPage.set(response.currentPage || 0);
        this.updateCounts();
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des fichiers:', err);
        this.error.set('Impossible de charger la liste des fichiers');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Met à jour les compteurs de fichiers actifs et expirés
   */
  updateCounts(): void {
    const allFiles = this.files();
    this.activeFilesCount.set(allFiles.filter(f => !f.isExpired).length);
    this.expiredFilesCount.set(allFiles.filter(f => f.isExpired).length);
  }

  /**
   * Applique le filtre sélectionné sur la liste des fichiers
   */
  applyFilter(): void {
    const allFiles = this.files();
    const filter = this.currentFilter();

    switch (filter) {
      case 'active':
        this.filteredFiles.set(allFiles.filter(f => !f.isExpired));
        break;
      case 'expired':
        this.filteredFiles.set(allFiles.filter(f => f.isExpired));
        break;
      default:
        this.filteredFiles.set(allFiles);
    }
  }

  /**
   * Change le filtre actif
   */
  onFilterChange(filter: FileFilter): void {
    this.currentFilter.set(filter);
    this.applyFilter();
  }

  /**
   * Gère le changement de page
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadFiles();
  }

  /**
   * Télécharge un fichier en tant que propriétaire (sans demander le mot de passe)
   * Utilise l'endpoint authentifié GET /api/download/owner/{token}
   */
  onDownloadFile(file: FileMetadata): void {
    // Extraire le token depuis l'URL de téléchargement
    const token = file.downloadUrl.split('/').pop()!;
    
    // Télécharger directement en tant que propriétaire (pas de mot de passe requis)
    this.performOwnerDownload(token, file.filename);
  }

  /**
   * Effectue le téléchargement du fichier en tant que propriétaire (endpoint authentifié)
   */
  private performOwnerDownload(token: string, filename: string): void {
    this.fileService.downloadFileAsOwner(token).subscribe({
      next: (blob) => {
        // Créer un lien temporaire pour déclencher le téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement:', err);
        let errorMessage = 'Erreur lors du téléchargement du fichier';
        
        if (err.status === 404) {
          errorMessage = 'Fichier non trouvé';
        } else if (err.status === 410) {
          errorMessage = 'Le fichier a expiré';
          // Recharger la liste pour mettre à jour l'affichage
          this.loadFiles();
        } else if (err.status === 403) {
          errorMessage = 'Accès refusé : vous n\'êtes pas le propriétaire de ce fichier';
        } else if (err.status === 401) {
          errorMessage = 'Vous devez vous reconnecter';
          this.authService.logout();
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  /**
   * Effectue le téléchargement du fichier (méthode legacy pour download public)
   */
  private performDownload(token: string, filename: string, password?: string): void {
    this.fileService.downloadFile(token, password).subscribe({
      next: (blob) => {
        // Créer un lien temporaire pour déclencher le téléchargement
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement:', err);
        let errorMessage = 'Erreur lors du téléchargement du fichier';
        
        if (err.status === 404) {
          errorMessage = 'Fichier non trouvé ou expiré';
        } else if (err.status === 403) {
          errorMessage = 'Mot de passe incorrect';
        } else if (err.status === 401) {
          errorMessage = 'Vous devez vous reconnecter';
          this.authService.logout();
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  /**
   * Supprime un fichier après confirmation
   */
  onDeleteFile(file: FileMetadata): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer le fichier ?',
        message: `Êtes-vous sûr de vouloir supprimer "${file.filename}" ?\n\nCette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.fileService.deleteFile(file.id).subscribe({
          next: () => {
            // Retirer le fichier de la liste locale
            const currentFiles = this.files();
            this.files.set(currentFiles.filter(f => f.id !== file.id));
            this.updateCounts();
            this.applyFilter();
            
            this.snackBar.open('Fichier supprimé avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            let errorMessage = 'Erreur lors de la suppression du fichier';
            
            if (error.status === 404) {
              errorMessage = 'Fichier non trouvé';
            } else if (error.status === 403) {
              errorMessage = 'Vous n\'avez pas l\'autorisation de supprimer ce fichier';
            } else if (error.status === 401) {
              errorMessage = 'Vous devez vous reconnecter';
              this.authService.logout();
            }
            
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }
        });
      }
    });
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Ouvre le modal d'upload de fichier
   */
  openUploadModal(): void {
    this.showUploadModal.set(true);
  }

  /**
   * Ferme le modal d'upload de fichier
   */
  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.loadFiles(); // Rafraîchir la liste après fermeture
  }

  /**
   * Callback appelé après l'upload réussi d'un fichier
   */
  onFileUploaded(): void {
    this.snackBar.open('Fichier uploadé avec succès', 'Fermer', {
      duration: 3000
    });
  }
}
