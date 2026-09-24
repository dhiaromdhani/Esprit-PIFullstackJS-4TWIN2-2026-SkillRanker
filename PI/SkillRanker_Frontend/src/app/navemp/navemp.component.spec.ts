import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavempComponent } from './navemp.component';

describe('NavempComponent', () => {
  let component: NavempComponent;
  let fixture: ComponentFixture<NavempComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavempComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavempComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
