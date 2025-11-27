import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  imports: [],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      (click)="handleClick()"
      [attr.aria-label]="ariaLabel()"
    >
      @if (loading()) {
        <span class="spinner"></span>
      }
      @if (icon() && !loading()) {
        <span class="icon">{{ icon() }}</span>
      }
      <span class="label">{{ label() }}</span>
    </button>
  `,
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  label = input.required<string>();
  type = input<'button' | 'submit' | 'reset'>('button');
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('medium');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  fullWidth = input<boolean>(false);
  icon = input<string>('');
  ariaLabel = input<string>('');
  
  clicked = output<void>();

  buttonClasses(): string {
    const classes = ['button'];
    classes.push(`button--${this.variant()}`);
    classes.push(`button--${this.size()}`);
    if (this.fullWidth()) classes.push('button--full-width');
    if (this.disabled()) classes.push('button--disabled');
    if (this.loading()) classes.push('button--loading');
    return classes.join(' ');
  }

  handleClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
