import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoanMonitoringService, MonitoringDashboard, LoanInfo, LoanAlert } from '../../services/loan-monitoring.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-monitoring-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoring-dashboard.component.html',
  styleUrls: ['./monitoring-dashboard.component.css']
})
export class MonitoringDashboardComponent implements OnInit, OnDestroy {
  dashboard: MonitoringDashboard | null = null;
  loading = false;
  error: string | null = null;
  
  private subscription?: Subscription;
  private refreshInterval = 30000; // 30 segundos
  
  // Configuración de vista
  showResolved = false;
  selectedTab = 'overview'; // 'overview', 'loans', 'alerts'
  
  constructor(private monitoringService: LoanMonitoringService) {}

  ngOnInit() {
    this.loadDashboard();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  loadDashboard() {
    this.loading = true;
    this.error = null;
    
    this.monitoringService.getDashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.loading = false;
        console.log('📊 Dashboard actualizado:', new Date().toLocaleTimeString());
      },
      error: (error) => {
        this.error = 'Error cargando dashboard de monitoreo';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  startAutoRefresh() {
    this.subscription = interval(this.refreshInterval).subscribe(() => {
      this.loadDashboard();
    });
  }

  stopAutoRefresh() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  refreshNow() {
    this.loadDashboard();
  }

  generateAlerts() {
    this.monitoringService.generateAlerts().subscribe({
      next: (result) => {
        console.log('✅ Alertas generadas:', result);
        this.loadDashboard(); // Refrescar datos
      },
      error: (error) => {
        console.error('Error generando alertas:', error);
      }
    });
  }

  resolveAlert(alertId: number) {
    if (confirm('¿Estás seguro de resolver esta alerta?')) {
      this.monitoringService.resolveAlert(alertId).subscribe({
        next: (result) => {
          console.log('✅ Alerta resuelta:', result);
          this.loadDashboard(); // Refrescar datos
        },
        error: (error) => {
          console.error('Error resolviendo alerta:', error);
        }
      });
    }
  }

  // Métodos de utilidad para la vista
  formatTime(minutes: number): string {
    return this.monitoringService.formatTimeRemaining(minutes);
  }

  formatElapsed(minutes: number): string {
    return this.monitoringService.formatTimeElapsed(minutes);
  }

  getStatusColor(status: string): string {
    return this.monitoringService.getStatusColor(status);
  }

  getStatusIcon(status: string): string {
    return this.monitoringService.getStatusIcon(status);
  }

  getAlertTypeColor(alertType: string): string {
    switch (alertType) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'overdue': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'warning': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  }

  getAlertIcon(alertType: string): string {
    switch (alertType) {
      case 'critical': return '🔴';
      case 'overdue': return '🟠';
      case 'warning': return '🟡';
      default: return '⚪';
    }
  }

  // Filtros
  get filteredOverdueLoans(): LoanInfo[] {
    return this.dashboard?.loans.byStatus.overdue || [];
  }

  get filteredWarningLoans(): LoanInfo[] {
    return this.dashboard?.loans.byStatus.warning || [];
  }

  get filteredActiveLoans(): LoanInfo[] {
    return this.dashboard?.loans.byStatus.active || [];
  }

  get filteredAlerts(): LoanAlert[] {
    if (!this.dashboard?.alerts.active) return [];
    
    if (this.showResolved) {
      return this.dashboard.alerts.active;
    }
    
    return this.dashboard.alerts.active.filter(alert => !alert.is_resolved);
  }

  // Estadísticas calculadas
  get totalActiveLoans(): number {
    return this.dashboard?.stats.loans.total_active_loans || 0;
  }

  get criticalAlertsCount(): number {
    return this.dashboard?.alerts.count.critical || 0;
  }

  get overdueLoansCount(): number {
    return this.dashboard?.stats.loans.overdue_loans || 0;
  }

  get averageLoanDuration(): string {
    const avg = this.dashboard?.stats.loans.avg_loan_duration || 0;
    return this.formatElapsed(avg);
  }

  // Métodos de acción
  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  toggleShowResolved() {
    this.showResolved = !this.showResolved;
  }

  exportData() {
    if (!this.dashboard) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      dashboard: this.dashboard
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monitoring-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByAlertId(index: number, alert: LoanAlert): number {
    return alert.id;
  }
}