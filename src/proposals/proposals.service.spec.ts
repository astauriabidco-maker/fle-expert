import { Test, TestingModule } from '@nestjs/testing';
import { ProposalsService } from './proposals.service';

import { PrismaService } from '../prisma/prisma.service';

describe('ProposalsService', () => {
  let service: ProposalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        {
          provide: PrismaService,
          useValue: {
            trainingProposal: {
              findMany: jest.fn(),
              create: jest.fn(),
            }
          }
        }
      ],
    }).compile();

    service = module.get<ProposalsService>(ProposalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
