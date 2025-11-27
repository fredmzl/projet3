import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type CalloutType = 'info' | 'warning' | 'error';

@Component({
  selector: 'app-callout',
  imports: [],
  template: `
    <div [class]="calloutClasses()" role="alert">
      <span class="callout-icon">{{ iconMap[type()] }}</span>
      <span class="callout-message">{{ message() }}</span>
    </div>
  `,
  styleUrl: './callout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalloutComponent {
  message = input.required<string>();
  type = input<CalloutType>('info');
  
  iconMap: Record<CalloutType, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };

  calloutClasses(): string {
    return `callout callout--${this.type()}`;
  }
}
