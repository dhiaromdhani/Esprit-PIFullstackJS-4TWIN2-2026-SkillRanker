import { Component, OnInit } from '@angular/core';
import { StatsService } from '../service/stats.service';
import { Chart, registerables } from 'chart.js';
import { VocalService } from '../service/vocal.service';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit {

  skillStats: any = {};
  activityStats: any = {};
  loading = false;
  error: string | null = null;

  skillChart: any;
  activityChart: any;

  constructor(private statsService: StatsService, public vocalService: VocalService) {}

  ngOnInit(): void {
    this.loadSkillStats();
    this.loadActivityStats();
  }

  loadSkillStats(): void {
    this.loading = true;
    this.statsService.getSkillStats().subscribe({
      next: (data) => {
        this.skillStats = data;
        this.loading = false;

        // create chart ba3d ma data tjik
        setTimeout(() => {
          this.createSkillChart();
        }, 100);
      },
      error: (err) => {
        this.error = 'Erreur skill stats: ' + err.message;
        this.loading = false;
      }
    });
  }

  loadActivityStats(): void {
    this.loading = true;
    this.statsService.getActivityStats().subscribe({
      next: (data) => {
        this.activityStats = data;
        this.loading = false;

        setTimeout(() => {
          this.createActivityChart();
        }, 100);
      },
      error: (err) => {
        this.error = 'Erreur activity stats: ' + err.message;
        this.loading = false;
      }
    });
  }

  // 🎯 Skill Doughnut Chart
  createSkillChart() {
    if (this.skillChart) {
      this.skillChart.destroy();
    }

    this.skillChart = new Chart('skillChart', {
      type: 'doughnut',
      data: {
        labels: Object.keys(this.skillStats.skillsDistribution || {}),
        datasets: [{
          data: Object.values(this.skillStats.skillsDistribution || {}),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4CAF50',
            '#9C27B0'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // 🎯 Activity Pie Chart
  createActivityChart() {
    if (this.activityChart) {
      this.activityChart.destroy();
    }

    this.activityChart = new Chart('activityChart', {
      type: 'pie',
      data: {
        labels: ['Total Activities', 'Completed'],
        datasets: [{
          data: [
            this.activityStats.totalActivities || 0,
            this.activityStats.completedRecommendations || 0
          ],
          backgroundColor: [
            '#36A2EB',
            '#4CAF50'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}