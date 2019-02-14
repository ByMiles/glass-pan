import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LpanReceiveComponent } from './lpan-receive.component';

describe('LpanReceiveComponent', () => {
  let component: LpanReceiveComponent;
  let fixture: ComponentFixture<LpanReceiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LpanReceiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LpanReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
