import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LpanSendComponent } from './lpan-send.component';

describe('LpanSendComponent', () => {
  let component: LpanSendComponent;
  let fixture: ComponentFixture<LpanSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LpanSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LpanSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
