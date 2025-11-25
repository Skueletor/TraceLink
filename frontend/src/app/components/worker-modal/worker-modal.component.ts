import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-worker-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p>worker-modal works!</p>
  `,
  styles: []
})
export class WorkerModalComponent {
  // Este componente no se usa en la versión standalone
  // El modal está integrado en movement.component.html
}