import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OAuthSuccessComponent } from './oauth-success.component';

describe('OAuthSuccessComponent', () => {
  let component: OAuthSuccessComponent;
  let fixture: ComponentFixture<OAuthSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OAuthSuccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OAuthSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
