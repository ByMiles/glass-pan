import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IpPacketComponent } from './ip-packet.component';

describe('IpPacketComponent', () => {
  let component: IpPacketComponent;
  let fixture: ComponentFixture<IpPacketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IpPacketComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IpPacketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
