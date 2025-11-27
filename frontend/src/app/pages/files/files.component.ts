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
import { AuthService } from '../../core/services/auth.service';
import { FileService } from '../../core/services/file.service';
import { FileUploadModalComponent } from '../../shared/components/file-upload-modal/file-upload-modal.component';
import { FileCardComponent } from '../../shared/components/file-card/file-card.component';
import { CalloutComponent } from '../../shared/components/callout/callout.component';
import { FileMetadata, FileFilter } from '../../core/models/file.model';

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
  currentFilter = signal<FileFilter>('all');

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
   * Ouvre le lien de téléchargement dans un nouvel onglet
   */
  onDownloadFile(file: FileMetadata): void {
    window.open(file.downloadUrl, '_blank');
  }

  /**
   * Supprime un fichier (TODO: implémenter dans US06)
   */
  onDeleteFile(file: FileMetadata): void {
    // TODO: Implémenter la suppression dans US06
    console.log('Supprimer le fichier:', file.id);
    this.snackBar.open('Suppression non implémentée (US06)', 'Fermer', {
      duration: 3000
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
  }

  /**
   * Callback appelé après l'upload réussi d'un fichier
   */
  onFileUploaded(): void {
    this.closeUploadModal();
    this.loadFiles(); // Rafraîchir la liste
    this.snackBar.open('Fichier uploadé avec succès', 'Fermer', {
      duration: 3000
    });
  }
}
