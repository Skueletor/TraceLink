import { TestBed } from '@angular/core/testing';

import { MovemeService } from './moveme.service';

describe('MovemeService', () => {
  let service: MovemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
