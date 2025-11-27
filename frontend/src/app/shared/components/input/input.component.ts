import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-input',
  imports: [],
  template: `
    <div class="input-wrapper">
      @if (label()) {
        <label [for]="id()" class="input-label">
          {{ label() }}
        </label>
      }
      <input
        [id]="id()"
        [type]="type()"
        [placeholder]="placeholder()"
        [required]="required()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        class="input-field"
        [attr.aria-label]="ariaLabel() || label()"
        [attr.aria-required]="required()"
        [attr.aria-invalid]="invalid()"
      />
    </div>
  `,
  styleUrl: './input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent {
  id = input.required<string>();
  label = input<string>('');
  type = input<string>('text');
  placeholder = input<string>('');
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  ariaLabel = input<string>('');
  
  value = model<string>('');

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
  }
}
