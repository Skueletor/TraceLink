import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BuildingService, Building } from '../../services/building.service';
import { ToolService, Tool } from '../../services/tool.service';
import { WorkerService, Worker } from '../../services/worker.service';
import { MovementService } from '../../services/moveme.service';

@Component({
  selector: 'app-movement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movement.component.html',
  styleUrls: ['./movement.component.css']
})
export class MovementComponent implements OnInit {
  buildings: Building[] = [];
  tools: Tool[] = [];
  workers: Worker[] = [];
  selectedTool: Tool | null = null;
  selectedFromBuilding: number | null = null;
  showWorkerModal = false;
  selectedWorker: Worker | null = null;
  toBuildingIdPending: number | null = null;

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
    console.log('🔄 Cargando datos...');
    
    this.buildingService.getAllBuildings().subscribe(data => {
      this.buildings = data;
      console.log('🏢 Edificios cargados:', data);
    });

    this.toolService.getAllTools().subscribe(data => {
      this.tools = data;
      console.log('🔧 Herramientas cargadas:', data);
    });

    this.workerService.getAllWorkers().subscribe(data => {
      this.workers = data;
      console.log('👥 Trabajadores cargados:', data);
    });
  }

  getToolsByBuilding(buildingName: string): Tool[] {
    const building = this.buildings.find(b => b.name === buildingName);
    if (!building) return [];
    
    const toolsInBuilding = this.tools.filter(t => 
      t.building_id === building.id || 
      t.current_building_id === building.id ||
      t.building_name?.includes(buildingName.split(' - ')[0])
    );
    
    console.log(`🔍 Herramientas en ${buildingName}:`, toolsInBuilding);
    return toolsInBuilding;
  }

  onDragStart(event: DragEvent, tool: Tool, buildingId: number) {
    console.log('🎯 Iniciando arrastre:', tool.name, 'desde edificio:', buildingId);
    this.selectedTool = tool;
    this.selectedFromBuilding = buildingId;
    event.dataTransfer!.effectAllowed = 'move';
    
    // Agregar clase visual
    const target = event.target as HTMLElement;
    target.classList.add('opacity-50');
  }

  onDragEnd(event: DragEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('opacity-50');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDragEnter(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50');
  }

  onDragLeave(event: DragEvent) {
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
  }

  onDrop(event: DragEvent, toBuildingId: number) {
    event.preventDefault();
    
    // Remover clases visuales
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-blue-500', 'bg-blue-50');
    
    if (!this.selectedTool || this.selectedFromBuilding === toBuildingId) {
      console.log('❌ Movimiento cancelado: mismo edificio o sin herramienta');
      return;
    }

    console.log('📦 Soltando herramienta:', this.selectedTool.name, 'en edificio:', toBuildingId);

    // Si sale del almacén (edificio 3) y no tiene trabajador asignado
    const almacenBuilding = this.buildings.find(b => b.description === 'Almacén');
    if (this.selectedFromBuilding === almacenBuilding?.id && !this.selectedTool.worker_name) {
      console.log('👤 Requiere asignar trabajador');
      this.toBuildingIdPending = toBuildingId;
      this.showWorkerModal = true;
      return;
    }

    this.executeMovement(toBuildingId);
  }

  executeMovement(toBuildingId: number) {
    if (!this.selectedTool) return;

    console.log('✅ Ejecutando movimiento:', {
      tool: this.selectedTool.name,
      from: this.selectedFromBuilding,
      to: toBuildingId,
      worker: this.selectedWorker?.name
    });

    const movement = {
      tool_id: this.selectedTool.id,
      worker_id: this.selectedWorker?.id || null,
      from_building_id: this.selectedFromBuilding,
      to_building_id: toBuildingId,
      movement_type: 'transfer',
      action_description: `Movimiento de ${this.selectedTool.name} de edificio ${this.selectedFromBuilding} a ${toBuildingId}`
    };

    this.movementService.createMovement(movement).subscribe({
      next: (response) => {
        console.log('✅ Movimiento registrado:', response);
        
        const almacenBuilding = this.buildings.find(b => b.description === 'Almacén');
        
        // Si hay trabajador seleccionado y sale del almacén, asignar
        if (this.selectedWorker && this.selectedFromBuilding === almacenBuilding?.id) {
          this.movementService.assignTool(
            this.selectedTool!.id, 
            this.selectedWorker.id, 
            toBuildingId
          ).subscribe({
            next: () => {
              console.log('✅ Herramienta asignada a trabajador');
              this.loadData();
            },
            error: (error) => console.error('❌ Error asignando:', error)
          });
        } 
        // Si vuelve al almacén, liberar asignación
        else if (toBuildingId === almacenBuilding?.id) {
          this.movementService.returnTool(this.selectedTool!.id).subscribe({
            next: () => {
              console.log('✅ Herramienta devuelta al almacén');
              this.loadData();
            },
            error: (error) => console.error('❌ Error devolviendo:', error)
          });
        } 
        // Movimiento simple entre edificios
        else {
          this.movementService.transferTool(this.selectedTool!.id, toBuildingId).subscribe({
            next: () => {
              console.log('✅ Herramienta transferida entre edificios');
              this.loadData();
            },
            error: (error) => console.error('❌ Error transfiriendo herramienta:', error)
          });
        }

        this.resetSelection();
      },
      error: (error) => {
        console.error('❌ Error en movimiento:', error);
        alert('Error al mover la herramienta. Revisa la consola.');
      }
    });
  }

  selectWorker(worker: Worker) {
    this.selectedWorker = worker;
    console.log('👤 Trabajador seleccionado:', worker.name);
  }

  confirmWorkerAssignment() {
    if (this.selectedWorker && this.selectedTool && this.toBuildingIdPending) {
      console.log('✅ Confirmando asignación de trabajador');
      this.showWorkerModal = false;
      this.executeMovement(this.toBuildingIdPending);
    } else {
      alert('Debes seleccionar un trabajador');
    }
  }

  cancelWorkerModal() {
    console.log('❌ Modal cancelado');
    this.showWorkerModal = false;
    this.resetSelection();
  }

  resetSelection() {
    this.selectedTool = null;
    this.selectedFromBuilding = null;
    this.selectedWorker = null;
    this.toBuildingIdPending = null;
  }

  isAlmacen(building: Building | undefined): boolean {
    return !!building && building.description === 'Almacén';
  }

  sortedBuildings(): Building[] {
    const almacen = this.buildings.filter(b => this.isAlmacen(b));
    const others = this.buildings.filter(b => !this.isAlmacen(b));
    return [...almacen, ...others];
  }
}