import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Building {
  id: number;
  name: string;
  description: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuildingService {
  constructor(private api: ApiService) { }

  getAllBuildings(): Observable<Building[]> {
    return this.api.get<Building[]>('/buildings');
  }

  getBuildingById(id: number): Observable<Building> {
    return this.api.get<Building>(`/buildings/${id}`);
  }
}