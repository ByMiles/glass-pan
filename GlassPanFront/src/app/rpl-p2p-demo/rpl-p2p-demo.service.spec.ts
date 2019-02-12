import { TestBed } from '@angular/core/testing';

import { RplP2pDemoService } from './rpl-p2p-demo.service';

describe('RplP2pDemoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RplP2pDemoService = TestBed.get(RplP2pDemoService);
    expect(service).toBeTruthy();
  });
});
