import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Movement {
  id: number;
  tool_id: number;
  worker_id: number | null;
  from_building_id: number | null;
  to_building_id: number;
  movement_type: string;
  action_description: string;
  created_at: string;
  tool_name?: string;
  worker_name?: string;
  worker_code?: string;
  from_building?: string;
  to_building?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  constructor(private api: ApiService) { }

  getAllMovements(limit: number = 50): Observable<Movement[]> {
    return this.api.get<Movement[]>(`/movements?limit=${limit}`);
  }

  createMovement(movement: Partial<Movement>): Observable<Movement> {
    return this.api.post<Movement>('/movements', movement);
  }

  assignTool(toolId: number, workerId: number, buildingId: number): Observable<any> {
    return this.api.post('/movements/assign', { toolId, workerId, buildingId });
  }

  transferTool(toolId: number, buildingId: number): Observable<any> {
    return this.api.post('/movements/transfer', { toolId, buildingId });
  }

  returnTool(toolId: number): Observable<any> {
    return this.api.post('/movements/return', { toolId });
  }
}