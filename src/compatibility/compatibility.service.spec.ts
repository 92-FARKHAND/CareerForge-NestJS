import { Test, TestingModule } from '@nestjs/testing';
import { CompatibilityService } from './compatibility.service';

describe('CompatibilityService', () => {
  let service: CompatibilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompatibilityService],
    }).compile();

    service = module.get<CompatibilityService>(CompatibilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
