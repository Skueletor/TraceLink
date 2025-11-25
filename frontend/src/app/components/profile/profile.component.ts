import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  passwordLoading = false;
  message = '';
  passwordMessage = '';
  userInfo: any = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadUserInfo();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value 
      ? null : { passwordMismatch: true };
  }

  loadUserInfo() {
    this.auth.getMe().subscribe({
      next: user => {
        this.userInfo = user;
        this.profileForm.patchValue({ name: user.name });
      },
      error: () => {
        this.message = 'Error cargando información del usuario';
      }
    });
  }

  updateProfile() {
    if (this.profileForm.invalid) return;
    
    this.loading = true;
    this.message = '';
    
    const { name } = this.profileForm.value;
    
    this.http.put(`${environment.api}/auth/profile`, { name }).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.message = 'Perfil actualizado correctamente';
        // Actualizar localStorage para reflejar cambios
        localStorage.setItem('user_name', response.name);
        this.userInfo = { ...this.userInfo, name: response.name };
        setTimeout(() => this.message = '', 3000);
      },
      error: () => {
        this.loading = false;
        this.message = 'Error actualizando el perfil';
      }
    });
  }

  updatePassword() {
    if (this.passwordForm.invalid) return;
    
    this.passwordLoading = true;
    this.passwordMessage = '';
    
    const { currentPassword, newPassword } = this.passwordForm.value;
    
    this.http.put(`${environment.api}/auth/profile`, { 
      currentPassword, 
      newPassword 
    }).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordMessage = 'Contraseña actualizada correctamente';
        this.passwordForm.reset();
        setTimeout(() => this.passwordMessage = '', 3000);
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordMessage = err.error?.error || 'Error actualizando la contraseña';
      }
    });
  }
}