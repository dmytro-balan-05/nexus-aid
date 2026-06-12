import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

describe('AppService', () => {
  let service: AppService;

  const mockPrisma = {
    campaign: { count: jest.fn() },
    donation: { count: jest.fn() },
    user: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getStats should return real counts from DB', async () => {
    mockPrisma.campaign.count.mockResolvedValue(5);
    mockPrisma.donation.count.mockResolvedValue(20);
    mockPrisma.user.count.mockResolvedValue(3);

    const result = await service.getStats();

    expect(result).toEqual({ campaigns: 5, donations: 20, volunteers: 3 });
    expect(mockPrisma.campaign.count).toHaveBeenCalledWith({
      where: { status: 'active' },
    });
    expect(mockPrisma.donation.count).toHaveBeenCalledWith({
      where: { status: 'approved' },
    });
    expect(mockPrisma.user.count).toHaveBeenCalledWith({
      where: { role: 'volonteer' },
    });
  });

  it('getStats should return zeros when DB is empty', async () => {
    mockPrisma.campaign.count.mockResolvedValue(0);
    mockPrisma.donation.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);

    const result = await service.getStats();
    expect(result).toEqual({ campaigns: 0, donations: 0, volunteers: 0 });
  });
});
