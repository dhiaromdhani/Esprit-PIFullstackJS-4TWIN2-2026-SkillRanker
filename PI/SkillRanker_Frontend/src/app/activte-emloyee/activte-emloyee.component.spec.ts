import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivteEmloyeeComponent } from './activte-emloyee.component';

describe('ActivteEmloyeeComponent', () => {
  let component: ActivteEmloyeeComponent;
  let fixture: ComponentFixture<ActivteEmloyeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActivteEmloyeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivteEmloyeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
