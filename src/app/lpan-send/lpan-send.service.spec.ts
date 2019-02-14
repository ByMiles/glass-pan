import { TestBed } from '@angular/core/testing';

import { LpanSendService } from './lpan-send.service';

describe('LpanSendService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LpanSendService = TestBed.get(LpanSendService);
    expect(service).toBeTruthy();
  });
});
