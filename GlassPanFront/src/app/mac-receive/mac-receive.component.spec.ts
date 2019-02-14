import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MacReceiveComponent } from './mac-receive.component';

describe('MacReceiveComponent', () => {
  let component: MacReceiveComponent;
  let fixture: ComponentFixture<MacReceiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MacReceiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MacReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
