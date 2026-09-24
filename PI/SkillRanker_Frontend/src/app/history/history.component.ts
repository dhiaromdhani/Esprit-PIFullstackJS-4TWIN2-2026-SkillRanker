import { Component, OnInit } from '@angular/core';
import { HistoryService, RecommendationHistory } from '../service/history.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
 // styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
  history: RecommendationHistory[] = [];
  loading = false;
  error: string | null = null;

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;
    this.historyService.getHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'historique: ' + err.message;
        this.loading = false;
        console.error('Error loading history:', err);
      }
    });
  }
}