import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Worker {
  id: number;
  name: string;
  code: string;
  role: string;
  area: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  constructor(private api: ApiService) { }

  getAllWorkers(): Observable<Worker[]> {
    return this.api.get<Worker[]>('/workers');
  }

  getWorkerById(id: number): Observable<Worker> {
    return this.api.get<Worker>(`/workers/${id}`);
  }

  createWorker(worker: Partial<Worker>): Observable<Worker> {
    return this.api.post<Worker>('/workers', worker);
  }

  updateWorker(id: number, worker: Partial<Worker>): Observable<Worker> {
    return this.api.put<Worker>(`/workers/${id}`, worker);
  }

  deleteWorker(id: number): Observable<any> {
    return this.api.delete(`/workers/${id}`);
  }
}