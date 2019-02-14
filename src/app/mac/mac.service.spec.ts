import { TestBed } from '@angular/core/testing';

import { MacService } from './mac.service';

describe('MacService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MacService = TestBed.get(MacService);
    expect(service).toBeTruthy();
  });
});
