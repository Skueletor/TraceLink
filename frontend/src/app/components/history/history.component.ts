import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovementService, Movement } from '../../services/moveme.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  movements: Movement[] = [];

  constructor(private movementService: MovementService) {}

  ngOnInit() {
    this.loadMovements();
  }

  loadMovements() {
    console.log('🔄 Cargando historial...');
    this.movementService.getAllMovements(50).subscribe({
      next: (data) => {
        this.movements = data;
        console.log('📋 Movimientos cargados:', data);
      },
      error: (error) => {
        console.error('❌ Error cargando historial:', error);
      }
    });
  }
}