import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreferredDetailComponent } from './preferred-detail.component';

describe('PreferredDetailComponent', () => {
  let component: PreferredDetailComponent;
  let fixture: ComponentFixture<PreferredDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreferredDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreferredDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
