import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Tool {
  id: number;
  name: string;
  code: string;
  category: string;
  max_time: string;
  status: string;
  worker_name?: string;
  worker_code?: string;
  worker_id?: number;
  building_name?: string;
  building_id?: number;
  current_building_id?: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  constructor(private api: ApiService) { }

  getAllTools(): Observable<Tool[]> {
    return this.api.get<Tool[]>('/tools');
  }

  getToolById(id: number): Observable<Tool> {
    return this.api.get<Tool>(`/tools/${id}`);
  }

  createTool(tool: Partial<Tool>): Observable<Tool> {
    return this.api.post<Tool>('/tools', tool);
  }

  updateTool(id: number, tool: Partial<Tool>): Observable<Tool> {
    return this.api.put<Tool>(`/tools/${id}`, tool);
  }

  deleteTool(id: number): Observable<any> {
    return this.api.delete(`/tools/${id}`);
  }
}