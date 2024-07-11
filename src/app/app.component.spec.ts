import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { AppComponent } from './app.component';
import { ElementRef } from '@angular/core';
import { Chart } from 'chart.js';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockElementRef: jasmine.SpyObj<ElementRef>;

  beforeEach(async () => {
    mockElementRef = jasmine.createSpyObj('ElementRef', [], {
      nativeElement: {
        querySelector: jasmine.createSpy('querySelector').and.returnValue(document.createElement('canvas'))
      }
    });

    await TestBed.configureTestingModule({
      declarations: [ AppComponent ],
      imports: [ FormsModule ],
      providers: [
        { provide: ElementRef, useValue: mockElementRef }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([
      { userName: 'John Doe', workoutType: 'Running', workoutMinutes: 30 },
      { userName: 'Jane Smith', workoutType: 'Yoga', workoutMinutes: 45 }
    ]));

    spyOn(localStorage, 'setItem');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load workout entries on init', () => {
    expect(component.workoutEntries.length).toBe(2);
  });

  it('should add a new workout entry', () => {
    spyOn(component, 'updateChart');
    component.userName = 'Test User';
    component.workoutType = 'Cycling';
    component.workoutMinutes = 60;

    const mockForm = {
      valid: true,
      resetForm: jasmine.createSpy('resetForm')
    };

    component.onSubmit(mockForm as unknown as NgForm);

    expect(component.workoutEntries.length).toBe(3);
    expect(localStorage.setItem).toHaveBeenCalled();
    expect(component.updateChart).toHaveBeenCalled();
    expect(mockForm.resetForm).toHaveBeenCalled();
  });

  it('should filter entries', () => {
    component.searchTerm = 'John';
    component.applyFilters();
    expect(component.filteredEntries.length).toBe(1);
  });

  it('should change page', () => {
    component.itemsPerPage = 1;
    component.applyFilters();
    component.changePage(1);
    expect(component.currentPage).toBe(2);
  });

  it('should update chart when selecting a user', () => {
    spyOn(Chart.prototype, 'destroy');
    spyOn(Chart, 'register');
    spyOn(component, 'updateChart');

    component.selectUser('John Doe');

    expect(component.selectedUser).toBe('John Doe');
    expect(component.updateChart).toHaveBeenCalled();
  });

  it('should get number of workouts for a user', () => {
    const count = component.getNumberOfWorkouts('John Doe');
    expect(count).toBe(1);
  });

  it('should get total workout minutes for a user', () => {
    const total = component.getTotalWorkoutMinutes('John Doe');
    expect(total).toBe(30);
  });

  it('should reset form', () => {
    const mockForm = {
      resetForm: jasmine.createSpy('resetForm')
    };
    component.userName = 'Test';
    component.workoutType = 'Running';
    component.workoutMinutes = 30;

    component.resetForm(mockForm as unknown as NgForm);

    expect(mockForm.resetForm).toHaveBeenCalled();
    expect(component.userName).toBe('');
    expect(component.workoutType).toBe('');
    expect(component.workoutMinutes).toBe(0);
  });

  it('should reset form manually if resetForm is not available', () => {
    const mockForm = {};
    component.userName = 'Test';
    component.workoutType = 'Running';
    component.workoutMinutes = 30;

    component.resetForm(mockForm as unknown as NgForm);

    expect(component.userName).toBe('');
    expect(component.workoutType).toBe('');
    expect(component.workoutMinutes).toBe(0);
  });
});
