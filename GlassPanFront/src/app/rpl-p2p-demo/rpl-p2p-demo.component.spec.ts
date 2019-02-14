import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RplP2pDemoComponent } from './rpl-p2p-demo.component';

describe('RplP2pDemoComponent', () => {
  let component: RplP2pDemoComponent;
  let fixture: ComponentFixture<RplP2pDemoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RplP2pDemoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RplP2pDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
