import { TestBed } from '@angular/core/testing';

import { MacReceiveService } from './mac-receive.service';

describe('MacReceiveService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MacReceiveService = TestBed.get(MacReceiveService);
    expect(service).toBeTruthy();
  });
});
