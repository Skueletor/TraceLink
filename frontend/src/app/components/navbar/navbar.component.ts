import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/movement', label: 'Mover Herramientas', icon: '🔄' },
    { path: '/history', label: 'Historial', icon: '🕐' },
    { path: '/workers', label: 'Trabajadores', icon: '👥' },
    { path: '/tools', label: 'Herramientas', icon: '🔧' }
  ];
}