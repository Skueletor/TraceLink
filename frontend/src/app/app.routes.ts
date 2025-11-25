import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MovementComponent } from './components/movement/movement.component';
import { HistoryComponent } from './components/history/history.component';
import { WorkersComponent } from './components/workers/workers.component';
import { ToolsComponent } from './components/tools/tools.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'movement', component: MovementComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'workers', component: WorkersComponent },
  { path: 'tools', component: ToolsComponent }
];