import { TestBed } from '@angular/core/testing';

import { MacSendService } from './mac-send.service';

describe('MacSendService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MacSendService = TestBed.get(MacSendService);
    expect(service).toBeTruthy();
  });
});
