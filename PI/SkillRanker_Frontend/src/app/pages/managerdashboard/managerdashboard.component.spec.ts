import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MANAGERDashboardComponent } from './managerdashboard.component';

describe('MANAGERDashboardComponent', () => {
  let component: MANAGERDashboardComponent;
  let fixture: ComponentFixture<MANAGERDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MANAGERDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MANAGERDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
