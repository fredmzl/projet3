import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

export type CalloutType = 'info' | 'warning' | 'error';

/**
 * Composant Callout pour afficher des messages d'information, avertissement ou erreur
 * Basé sur le design system fourni
 */
@Component({
  selector: 'app-callout',
  imports: [MatIconModule, NgClass],
  template: `
    <div class="callout" [ngClass]="'callout--' + type">
      <mat-icon class="callout__icon">{{ getIcon() }}</mat-icon>
      <span class="callout__label"><ng-content></ng-content></span>
    </div>
  `,
  styleUrl: './callout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalloutComponent {
  @Input() type: CalloutType = 'info';

  getIcon(): string {
    switch (this.type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }
}
