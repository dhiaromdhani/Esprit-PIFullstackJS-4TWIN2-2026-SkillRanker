import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilemployeComponent } from './profilemploye.component';

describe('ProfilemployeComponent', () => {
  let component: ProfilemployeComponent;
  let fixture: ComponentFixture<ProfilemployeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfilemployeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilemployeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
