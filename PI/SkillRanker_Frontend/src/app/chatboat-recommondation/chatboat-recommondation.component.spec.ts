import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatboatRecommondationComponent } from './chatboat-recommondation.component';

describe('ChatboatRecommondationComponent', () => {
  let component: ChatboatRecommondationComponent;
  let fixture: ComponentFixture<ChatboatRecommondationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatboatRecommondationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatboatRecommondationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
