import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MovementComponent } from './components/movement/movement.component';
import { HistoryComponent } from './components/history/history.component';
import { WorkersComponent } from './components/workers/workers.component';
import { ToolsComponent } from './components/tools/tools.component';
import { MonitoringDashboardComponent } from './components/monitoring-dashboard/monitoring-dashboard.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'movement', component: MovementComponent, canActivate: [authGuard] },
  { path: 'history', component: HistoryComponent, canActivate: [authGuard] },
  { path: 'workers', component: WorkersComponent, canActivate: [authGuard] },
  { path: 'tools', component: ToolsComponent, canActivate: [authGuard] },
  { path: 'monitoring', component: MonitoringDashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];