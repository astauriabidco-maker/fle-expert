import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';

import { PrismaService } from '../prisma/prisma.service';

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: PrismaService,
          useValue: {
            contract: {
              findMany: jest.fn(),
              create: jest.fn(),
            }
          }
        }
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
