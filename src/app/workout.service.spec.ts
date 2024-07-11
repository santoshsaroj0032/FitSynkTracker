import { TestBed } from '@angular/core/testing';
import { WorkoutService, WorkoutEntry } from './workout.service';

describe('WorkoutService', () => {
  let service: WorkoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorage.clear(); // Clear localStorage before each test
  });

  it('should be created', () => {
    service = TestBed.inject(WorkoutService);
    expect(service).toBeTruthy();
  });

  it('should initialize with sample data if localStorage is empty', () => {
    service = TestBed.inject(WorkoutService);
    const entries = service.getWorkoutEntries();
    expect(entries.length).toBe(6);
  });

  it('should add a new workout entry', () => {
    service = TestBed.inject(WorkoutService);
    const newEntry: Omit<WorkoutEntry, 'id'> = {
      userName: 'Test User',
      workoutType: 'Running',
      workoutMinutes: 30
    };
    service.addWorkoutEntry(newEntry);
    const entries = service.getWorkoutEntries();
    expect(entries.length).toBe(7);
    expect(entries[6].userName).toBe('Test User');
  });

  it('should delete a workout entry', () => {
    service = TestBed.inject(WorkoutService);
    const entries = service.getWorkoutEntries();
    const idToDelete = entries[0].id;
    service.deleteWorkoutEntry(idToDelete);
    const updatedEntries = service.getWorkoutEntries();
    expect(updatedEntries.length).toBe(5);
    expect(updatedEntries.find(e => e.id === idToDelete)).toBeUndefined();
  });

  it('should load data from localStorage if available', () => {
    const testData: WorkoutEntry[] = [
      { id: '1', userName: 'Test User', workoutType: 'Running', workoutMinutes: 30 }
    ];
    localStorage.setItem('workoutEntries', JSON.stringify(testData));

    service = TestBed.inject(WorkoutService);

    const entries = service.getWorkoutEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].userName).toBe('Test User');
  });
});
