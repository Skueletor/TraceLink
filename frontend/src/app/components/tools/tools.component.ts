import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolService, Tool } from '../../services/tool.service';
import { BuildingService, Building } from '../../services/building.service';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.css']
})
export class ToolsComponent implements OnInit {
  tools: Tool[] = [];
  buildings: Building[] = [];
  showModal = false;
  isEditMode = false;
  currentTool: Partial<Tool> = {};

  constructor(
    private toolService: ToolService,
    private buildingService: BuildingService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.toolService.getAllTools().subscribe(data => {
      this.tools = data;
    });

    this.buildingService.getAllBuildings().subscribe(data => {
      this.buildings = data;
    });
  }

  openCreateModal() {
    this.isEditMode = false;
    this.currentTool = {};
    this.showModal = true;
  }

  openEditModal(tool: Tool) {
    this.isEditMode = true;
    this.currentTool = { ...tool };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentTool = {};
  }

  saveTool() {
    if (this.isEditMode && this.currentTool.id) {
      this.toolService.updateTool(this.currentTool.id, this.currentTool).subscribe(() => {
        this.loadData();
        this.closeModal();
      });
    } else {
      this.toolService.createTool(this.currentTool).subscribe(() => {
        this.loadData();
        this.closeModal();
      });
    }
  }

  deleteTool(id: number) {
    if (confirm('¿Estás seguro de eliminar esta herramienta?')) {
      this.toolService.deleteTool(id).subscribe(() => {
        this.loadData();
      });
    }
  }
}