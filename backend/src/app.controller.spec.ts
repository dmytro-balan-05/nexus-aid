import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

describe('AppController', () => {
  let appController: AppController;

  const mockPrisma = {
    campaign: { count: jest.fn().mockResolvedValue(0) },
    donation: { count: jest.fn().mockResolvedValue(0) },
    user: { count: jest.fn().mockResolvedValue(0) },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('getStats should return stats object', async () => {
    const result = await appController.getStats();
    expect(result).toHaveProperty('campaigns');
    expect(result).toHaveProperty('donations');
    expect(result).toHaveProperty('volunteers');
  });
});
