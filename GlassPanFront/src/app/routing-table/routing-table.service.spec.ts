import { TestBed } from '@angular/core/testing';

import { RoutingTableService } from './routing-table.service';

describe('RoutingTableService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RoutingTableService = TestBed.get(RoutingTableService);
    expect(service).toBeTruthy();
  });
});
