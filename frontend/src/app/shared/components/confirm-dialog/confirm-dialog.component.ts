import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="dialog-icon">warning</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p class="dialog-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Annuler' }}
      </button>
      <button 
        mat-raised-button 
        [color]="data.confirmColor || 'primary'"
        (click)="onConfirm()">
        {{ data.confirmText || 'Confirmer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      padding: 1.5rem 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .dialog-icon {
      color: #ff9800;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-dialog-content {
      padding: 1rem 1.5rem;
      min-width: 300px;
    }

    .dialog-message {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--color-text-secondary);
      white-space: pre-line;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem 1.5rem;
      gap: 0.75rem;
    }

    button {
      min-width: 100px;
    }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
