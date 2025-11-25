import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, timer, switchMap, BehaviorSubject } from 'rxjs';

export interface LoanInfo {
  assignment_id: number;
  tool_id: number;
  tool_name: string;
  tool_code: string;
  worker_id: number;
  worker_name: string;
  worker_code: string;
  building_name: string;
  assigned_at: string;
  max_time_str: string;
  max_time_minutes: number;
  time_elapsed_minutes: number;
  time_remaining_minutes: number;
  is_overdue: boolean;
  overdue_minutes: number;
  status: 'active' | 'warning' | 'overdue';
}

export interface LoanAlert {
  id: number;
  tool_assignment_id: number;
  worker_id: number;
  tool_id: number;
  alert_type: 'warning' | 'overdue' | 'critical';
  message: string;
  time_overdue: string;
  is_resolved: boolean;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  tool_name: string;
  tool_code: string;
  worker_name: string;
  worker_code: string;
  building_name: string;
  overdue_minutes: number;
}

export interface MonitoringStats {
  loans: {
    active_loans: number;
    warning_loans: number;
    overdue_loans: number;
    avg_loan_duration: number;
    total_active_loans: number;
  };
  alerts: {
    active_alerts: number;
    critical_alerts: number;
    total_alerts: number;
  };
}

export interface MonitoringDashboard {
  loans: {
    all: LoanInfo[];
    byStatus: {
      active: LoanInfo[];
      warning: LoanInfo[];
      overdue: LoanInfo[];
    };
    upcomingDue: LoanInfo[];
  };
  alerts: {
    active: LoanAlert[];
    count: {
      total: number;
      critical: number;
      overdue: number;
    };
  };
  stats: MonitoringStats;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoanMonitoringService {
  private dashboardSubject = new BehaviorSubject<MonitoringDashboard | null>(null);
  public dashboard$ = this.dashboardSubject.asObservable();
  
  private isPolling = false;
  private pollingInterval = 30000; // 30 segundos

  constructor(private api: ApiService) {}

  // Dashboard completo
  getDashboard(): Observable<MonitoringDashboard> {
    return this.api.get<MonitoringDashboard>('/monitoring/dashboard');
  }

  // Préstamos activos
  getActiveLoans(status?: string): Observable<LoanInfo[]> {
    const params = status ? { status } : undefined;
    return this.api.get<LoanInfo[]>('/monitoring/loans', params);
  }

  // Préstamos por trabajador
  getLoansByWorker(workerId: number): Observable<LoanInfo[]> {
    return this.api.get<LoanInfo[]>(`/monitoring/loans/worker/${workerId}`);
  }

  // Detalles de un préstamo específico
  getLoanDetails(assignmentId: number): Observable<LoanInfo & { alerts: LoanAlert[] }> {
    return this.api.get<LoanInfo & { alerts: LoanAlert[] }>(`/monitoring/loans/assignment/${assignmentId}`);
  }

  // Préstamos próximos a vencer
  getUpcomingDue(minutes: number = 30): Observable<LoanInfo[]> {
    return this.api.get<LoanInfo[]>('/monitoring/loans/upcoming-due', { minutes: minutes.toString() });
  }

  // Alertas activas
  getActiveAlerts(): Observable<LoanAlert[]> {
    return this.api.get<LoanAlert[]>('/monitoring/alerts');
  }

  // Todas las alertas (historial)
  getAllAlerts(limit: number = 50): Observable<LoanAlert[]> {
    return this.api.get<LoanAlert[]>('/monitoring/alerts/all', { limit: limit.toString() });
  }

  // Generar alertas manualmente
  generateAlerts(): Observable<{ success: boolean; alertsCreated: number; message: string }> {
    return this.api.post<{ success: boolean; alertsCreated: number; message: string }>('/monitoring/alerts/generate', {});
  }

  // Resolver alerta
  resolveAlert(alertId: number): Observable<{ success: boolean; message: string }> {
    return this.api.put<{ success: boolean; message: string }>(`/monitoring/alerts/${alertId}/resolve`, {});
  }

  // Estadísticas del sistema
  getSystemStats(): Observable<MonitoringStats> {
    return this.api.get<MonitoringStats>('/monitoring/stats');
  }

  // Iniciar polling automático del dashboard
  startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    console.log('🔄 Iniciando polling de monitoreo cada', this.pollingInterval / 1000, 'segundos');

    timer(0, this.pollingInterval).pipe(
      switchMap(() => this.getDashboard())
    ).subscribe({
      next: (dashboard) => {
        this.dashboardSubject.next(dashboard);
      },
      error: (error) => {
        console.error('Error en polling de monitoreo:', error);
      }
    });
  }

  // Detener polling
  stopPolling(): void {
    this.isPolling = false;
    console.log('⏸️ Polling de monitoreo detenido');
  }

  // Actualizar dashboard manualmente
  refreshDashboard(): Observable<MonitoringDashboard> {
    return this.getDashboard().pipe(
      switchMap((dashboard) => {
        this.dashboardSubject.next(dashboard);
        return [dashboard];
      })
    );
  }

  // Formatear tiempo restante para visualización
  formatTimeRemaining(minutes: number): string {
    if (minutes <= 0) return 'Vencido';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Formatear tiempo transcurrido
  formatTimeElapsed(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  // Obtener color según estado del préstamo
  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  // Obtener ícono según estado
  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return '✅';
      case 'warning': return '⚠️';
      case 'overdue': return '🚨';
      default: return '❓';
    }
  }
}