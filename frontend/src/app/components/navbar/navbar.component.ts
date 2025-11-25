import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  loggingOut = false;
  // Hacer público el servicio para uso en template (o usar getter)
  constructor(public auth: AuthService, private router: Router) {}
  userName: string | null = null;
  dropdownOpen = false;

  menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/movement', label: 'Mover Herramientas', icon: '🔄' },
    { path: '/monitoring', label: 'Monitoreo', icon: '⏰' },
    { path: '/history', label: 'Historial', icon: '🕐' },
    { path: '/workers', label: 'Trabajadores', icon: '👥' },
    { path: '/tools', label: 'Herramientas', icon: '🔧' }
  ];

  isAuth() { return this.auth.isAuthenticated(); }
  ngOnInit() {
    if (this.isAuth()) {
      this.loadUser();
    }
  }
  loadUser() {
    this.auth.getMe().subscribe({
      next: u => { this.userName = u?.name || null; },
      error: () => { this.userName = null; }
    });
  }
  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }
  
  @HostListener('document:click', ['$event'])
  closeDropdownOnClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    // Si el clic es dentro del dropdown o botón, no cerrar
    const dropdown = target.closest('.user-dropdown');
    if (!dropdown) {
      this.dropdownOpen = false;
    }
  }
  
  async logout() {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.auth.logout();
    // Pequeño delay para UX y asegurar limpieza
    setTimeout(() => {
      this.loggingOut = false;
      this.router.navigate(['/login']);
    }, 150);
  }
}