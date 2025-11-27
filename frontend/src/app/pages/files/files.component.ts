import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';
import { FileUploadModalComponent } from '../../shared/components/file-upload-modal/file-upload-modal.component';

@Component({
  selector: 'app-files',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    FileUploadModalComponent
  ],
  templateUrl: './files.component.html',
  styleUrl: './files.component.css'
})
export class FilesComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  showUploadModal = signal<boolean>(false);

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
    // TODO: rafraîchir la liste des fichiers (US05)
  }
}
