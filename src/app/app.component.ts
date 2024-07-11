import { Component, OnInit, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface WorkoutEntry {
  userName: string;
  workoutType: string;
  workoutMinutes: number;
}

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      <h1>Health Challenge Tracker</h1>
      <form #workoutForm="ngForm" (ngSubmit)="onSubmit(workoutForm)">
        <div class="form-group">
          <label for="userName">User Name*</label>
          <input type="text" id="userName" name="userName" [(ngModel)]="userName" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="workoutType">Workout Type*</label>
            <select id="workoutType" name="workoutType" [(ngModel)]="workoutType" required>
              <option value="">Select a workout type</option>
              <option *ngFor="let type of availableWorkoutTypes" [value]="type">{{type}}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="workoutMinutes">Workout Minutes*</label>
            <input type="number" id="workoutMinutes" name="workoutMinutes" [(ngModel)]="workoutMinutes" required>
          </div>
        </div>
        <button type="submit" [disabled]="!workoutForm.form.valid">Add Workout</button>
      </form>

      <div class="workout-list">
        <h2>Workout Entries</h2>
        <div class="filters">
          <input type="text" placeholder="Search by name" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
          <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
            <option value="">All Workout Types</option>
            <option *ngFor="let type of availableWorkoutTypes" [value]="type">{{type}}</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Workouts</th>
              <th>Number of Workouts</th>
              <th>Total Workout Minutes</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of paginatedEntries">
              <td>{{entry.userName}}</td>
              <td>{{entry.workoutType}}</td>
              <td>{{getNumberOfWorkouts(entry.userName)}}</td>
              <td>{{getTotalWorkoutMinutes(entry.userName)}}</td>
            </tr>
          </tbody>
        </table>
        <div class="pagination">
          <button (click)="changePage(-1)" [disabled]="currentPage === 1">&lt;</button>
          <span>Page {{currentPage}} of {{totalPages}}</span>
          <button (click)="changePage(1)" [disabled]="currentPage === totalPages">&gt;</button>
          <select [(ngModel)]="itemsPerPage" (ngModelChange)="applyFilters()">
            <option [value]="5">5 per page</option>
            <option [value]="10">10 per page</option>
            <option [value]="20">20 per page</option>
          </select>
        </div>
      </div>

      <div class="workout-progress">
        <div class="user-list">
          <h2>Users</h2>
          <ul>
            <li *ngFor="let user of getUniqueUsers()"
                (click)="selectUser(user)"
                [class.selected]="user === selectedUser">
              {{user}}
            </li>
          </ul>
        </div>
        <div class="chart-container" *ngIf="selectedUser">
          <h2>{{selectedUser}}'s workout progress</h2>
          <canvas id="chartCanvas"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
    .form-group { margin-bottom: 15px; }
    .form-row { display: flex; gap: 15px; }
    .form-row .form-group { flex: 1; }
    label { display: block; margin-bottom: 5px; color: #666; }
    input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:disabled { background-color: #cccccc; }
    .workout-list { margin-top: 30px; }
    .filters { display: flex; gap: 15px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
    .pagination span { margin: 0 10px; }
    .pagination select { margin-left: 10px; }
    .workout-progress { display: flex; margin-top: 30px; }
    .user-list { width: 200px; margin-right: 20px; }
    .user-list ul { list-style-type: none; padding: 0; }
    .user-list li { padding: 10px; cursor: pointer; border-bottom: 1px solid #ddd; }
    .user-list li.selected { background-color: #e0e0e0; }
    .chart-container { flex-grow: 1; }
    canvas { width: 100% !important; height: 300px !important; }
  `]
})
export class AppComponent implements OnInit {
  userName: string = '';
  workoutType: string = '';
  workoutMinutes: number = 0;
  workoutEntries: WorkoutEntry[] = [];
  filteredEntries: WorkoutEntry[] = [];
  paginatedEntries: WorkoutEntry[] = [];
  selectedUser: string | null = null;
  chart: Chart | null = null;

  searchTerm: string = '';
  filterType: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  availableWorkoutTypes: string[] = [
    'Running', 'Walking', 'Cycling', 'Swimming', 'Weightlifting',
    'Yoga', 'Pilates', 'HIIT', 'Dance', 'Martial Arts'
  ];

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.loadFromLocalStorage();
    this.applyFilters();
  }

  loadFromLocalStorage() {
    const storedData = localStorage.getItem('workoutEntries');
    if (storedData) {
      this.workoutEntries = JSON.parse(storedData);
    } else {
      // Initialize with sample data if localStorage is empty
      this.workoutEntries = [
        { userName: 'John Doe', workoutType: 'Running', workoutMinutes: 30 },
        { userName: 'John Doe', workoutType: 'Cycling', workoutMinutes: 45 },
        { userName: 'Jane Smith', workoutType: 'Swimming', workoutMinutes: 60 },
        { userName: 'Jane Smith', workoutType: 'Running', workoutMinutes: 20 },
        { userName: 'Mike Johnson', workoutType: 'Yoga', workoutMinutes: 50 },
        { userName: 'Mike Johnson', workoutType: 'Cycling', workoutMinutes: 40 }
      ];
      this.saveToLocalStorage();
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('workoutEntries', JSON.stringify(this.workoutEntries));
  }

  onSubmit(form: NgForm | any) {
    if (form.valid) {
      this.workoutEntries.push({
        userName: this.userName,
        workoutType: this.workoutType,
        workoutMinutes: this.workoutMinutes
      });
      this.saveToLocalStorage();
      this.applyFilters();
      this.selectUser(this.userName);
      this.resetForm(form);
    }
  }

  resetForm(form: NgForm | any) {
    if (form.resetForm && typeof form.resetForm === 'function') {
      form.resetForm();
    }
    // Reset component properties
    this.userName = '';
    this.workoutType = '';
    this.workoutMinutes = 0;
  }

  getUniqueUsers(): string[] {
    return Array.from(new Set(this.workoutEntries.map(entry => entry.userName)));
  }

  selectUser(user: string) {
    this.selectedUser = user;
    this.updateChart();
  }

  updateChart() {
    if (this.selectedUser) {
      const canvas = this.elementRef.nativeElement.querySelector('#chartCanvas');
      if (!canvas) return;

      const userEntries = this.workoutEntries.filter(entry => entry.userName === this.selectedUser);
      const workoutData: { [key: string]: number } = {};

      userEntries.forEach(entry => {
        if (workoutData[entry.workoutType]) {
          workoutData[entry.workoutType] += entry.workoutMinutes;
        } else {
          workoutData[entry.workoutType] = entry.workoutMinutes;
        }
      });

      const labels = Object.keys(workoutData);
      const data = Object.values(workoutData);

      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Workout Minutes',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  applyFilters() {
    this.filteredEntries = this.workoutEntries.filter(entry => {
      const nameMatch = entry.userName.toLowerCase().includes(this.searchTerm.toLowerCase());
      const typeMatch = this.filterType ? entry.workoutType === this.filterType : true;
      return nameMatch && typeMatch;
    });
    this.totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedEntries();
  }

  updatePaginatedEntries() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedEntries = this.filteredEntries.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(delta: number) {
    this.currentPage += delta;
    this.updatePaginatedEntries();
  }

  getNumberOfWorkouts(userName: string): number {
    return this.workoutEntries.filter(entry => entry.userName === userName).length;
  }

  getTotalWorkoutMinutes(userName: string): number {
    return this.workoutEntries
      .filter(entry => entry.userName === userName)
      .reduce((total, entry) => total + entry.workoutMinutes, 0);
  }
}
