import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionCompetenceComponent } from './question-competence.component';

describe('QuestionCompetenceComponent', () => {
  let component: QuestionCompetenceComponent;
  let fixture: ComponentFixture<QuestionCompetenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuestionCompetenceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionCompetenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
