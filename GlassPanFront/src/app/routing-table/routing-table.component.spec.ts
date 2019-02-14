import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutingTableComponent } from './routing-table.component';

describe('RoutingTableComponent', () => {
  let component: RoutingTableComponent;
  let fixture: ComponentFixture<RoutingTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoutingTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
