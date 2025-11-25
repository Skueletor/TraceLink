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
    // Validaciones básicas
    if (!this.currentTool.name || !this.currentTool.code || !this.currentTool.category || !this.currentTool.max_time) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    console.log('Guardando herramienta (modo edición:', this.isEditMode, '):', this.currentTool);

    // Preparar datos para enviar - asegurar que max_time esté presente
    const toolData = {
      name: this.currentTool.name,
      code: this.currentTool.code,
      category: this.currentTool.category,
      max_time: this.currentTool.max_time
    };

    console.log('Datos a enviar:', toolData);

    if (this.isEditMode && this.currentTool.id) {
      this.toolService.updateTool(this.currentTool.id, toolData).subscribe({
        next: (result) => {
          console.log('Herramienta actualizada exitosamente:', result);
          alert('Herramienta actualizada correctamente');
          this.loadData();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error actualizando herramienta:', error);
          const errorMessage = error.error?.error || error.message || 'Error desconocido';
          alert('Error actualizando la herramienta: ' + errorMessage);
        }
      });
    } else {
      this.toolService.createTool(toolData).subscribe({
        next: (result) => {
          console.log('Herramienta creada exitosamente:', result);
          alert('Herramienta creada correctamente');
          this.loadData();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creando herramienta:', error);
          const errorMessage = error.error?.error || error.message || 'Error desconocido';
          alert('Error creando la herramienta: ' + errorMessage);
        }
      });
    }
  }

  deleteTool(id: number) {
    if (confirm('¿Estás seguro de eliminar esta herramienta?')) {
      this.toolService.deleteTool(id).subscribe({
        next: () => {
          console.log('Herramienta eliminada exitosamente');
          this.loadData();
        },
        error: (error) => {
          console.error('Error eliminando herramienta:', error);
          alert('Error eliminando la herramienta: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  isFormValid(): boolean {
    return !!(this.currentTool.name && 
              this.currentTool.code && 
              this.currentTool.category && 
              this.currentTool.max_time);
  }
}