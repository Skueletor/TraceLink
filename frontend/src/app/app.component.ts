import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="min-h-screen bg-gray-100">
      <app-navbar></app-navbar>
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  title = 'TraceLink';
}