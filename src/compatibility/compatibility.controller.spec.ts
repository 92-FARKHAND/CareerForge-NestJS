import { Test, TestingModule } from '@nestjs/testing';
import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';

describe('CompatibilityController', () => {
  let controller: CompatibilityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompatibilityController],
      providers: [CompatibilityService],
    }).compile();

    controller = module.get<CompatibilityController>(CompatibilityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
