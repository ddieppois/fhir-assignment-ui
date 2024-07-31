import { TestBed } from '@angular/core/testing';

import { FhirApiService } from './fhir-api.service';

describe('FhirApiService', () => {
  let service: FhirApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FhirApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
