import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildingService, Building } from '../../services/building.service';
import { ToolService, Tool } from '../../services/tool.service';
import { WorkerService, Worker } from '../../services/worker.service';
import { MovementService, Movement } from '../../services/moveme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  buildings: Building[] = [];
  tools: Tool[] = [];
  workers: Worker[] = [];
  movements: Movement[] = [];
  alerts: any[] = [];

  constructor(
    private buildingService: BuildingService,
    private toolService: ToolService,
    private workerService: WorkerService,
    private movementService: MovementService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.buildingService.getAllBuildings().subscribe(data => {
      this.buildings = data;
    });

    this.toolService.getAllTools().subscribe(data => {
      this.tools = data;
    });

    this.workerService.getAllWorkers().subscribe(data => {
      this.workers = data;
    });

    this.movementService.getAllMovements(5).subscribe(data => {
      this.movements = data;
      this.generateAlerts();
    });
  }

  generateAlerts() {
    if (this.movements.length > 0) {
      this.alerts = this.movements.slice(0, 3).map(m => ({
        type: 'info',
        message: `${m.worker_name} movió ${m.tool_name} a ${m.to_building}`,
        timestamp: new Date(m.created_at)
      }));
    }
  }

  get availableTools() {
    return this.tools.filter(t => !t.worker_name).length;
  }

  get assignedTools() {
    return this.tools.filter(t => t.worker_name).length;
  }

  getToolsByBuilding(buildingName: string) {
    return this.tools.filter(t => t.building_name?.includes(buildingName.split(' - ')[0]));
  }
}