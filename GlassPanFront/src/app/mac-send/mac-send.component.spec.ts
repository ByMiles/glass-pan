import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MacSendComponent } from './mac-send.component';

describe('MacSendComponent', () => {
  let component: MacSendComponent;
  let fixture: ComponentFixture<MacSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MacSendComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MacSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
