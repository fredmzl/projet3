import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  /**
   * Navigue vers la page appropriée selon l'état de connexion
   */
  handleUploadClick(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/files']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Navigue vers login ou files selon l'état
   */
  handleHeaderButtonClick(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/files']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
