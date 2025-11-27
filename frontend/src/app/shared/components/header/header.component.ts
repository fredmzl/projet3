import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type HeaderVariant = 'login' | 'authenticated';

@Component({
  selector: 'app-header',
  imports: [],
  template: `
    <header class="header">
      <h1 class="logo">DataShare</h1>
      <button 
        type="button" 
        class="header-button"
        [attr.aria-label]="variant() === 'login' ? 'Se connecter' : 'Accéder à mon espace'"
      >
        {{ variant() === 'login' ? 'Se connecter' : 'Mon espace' }}
      </button>
    </header>
  `,
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  variant = input<HeaderVariant>('login');
}
