import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkerService, Worker } from '../../services/worker.service';
import { ToolService, Tool } from '../../services/tool.service';

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  workers: Worker[] = [];
  tools: Tool[] = [];
  showModal = false;
  isEditMode = false;
  currentWorker: Partial<Worker> = {};

  constructor(
    private workerService: WorkerService,
    private toolService: ToolService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.workerService.getAllWorkers().subscribe(data => {
      this.workers = data;
    });

    this.toolService.getAllTools().subscribe(data => {
      this.tools = data;
    });
  }

  getAssignedTools(workerId: number): Tool[] {
    return this.tools.filter(t => t.worker_name && this.workers.find(w => w.id === workerId && w.name === t.worker_name));
  }

  openCreateModal() {
    this.isEditMode = false;
    this.currentWorker = {};
    this.showModal = true;
  }

  openEditModal(worker: Worker) {
    this.isEditMode = true;
    this.currentWorker = { ...worker };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentWorker = {};
  }

  saveWorker() {
    if (this.isEditMode && this.currentWorker.id) {
      this.workerService.updateWorker(this.currentWorker.id, this.currentWorker).subscribe(() => {
        this.loadData();
        this.closeModal();
      });
    } else {
      this.workerService.createWorker(this.currentWorker).subscribe(() => {
        this.loadData();
        this.closeModal();
      });
    }
  }

  deleteWorker(id: number) {
    if (confirm('¿Estás seguro de eliminar este trabajador?')) {
      this.workerService.deleteWorker(id).subscribe(() => {
        this.loadData();
      });
    }
  }
}