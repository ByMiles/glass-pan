import { TestBed } from '@angular/core/testing';

import { LpanTagService } from './lpan-tag.service';

describe('LpanTagService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LpanTagService = TestBed.get(LpanTagService);
    expect(service).toBeTruthy();
  });
});
