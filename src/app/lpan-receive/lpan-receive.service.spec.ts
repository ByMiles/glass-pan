import { TestBed } from '@angular/core/testing';

import { LpanReceiveService } from './lpan-receive.service';

describe('LpanReceiveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LpanReceiveService = TestBed.get(LpanReceiveService);
    expect(service).toBeTruthy();
  });
});
