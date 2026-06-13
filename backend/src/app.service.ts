import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getStats() {
    const [campaigns, donations, volunteers] = await Promise.all([
      this.prisma.campaign.count({ where: { status: 'active' } }),
      this.prisma.donation.count({ where: { status: 'approved' } }),
      this.prisma.user.count({ where: { role: 'volonteer' } }),
    ]);
    return { campaigns, donations, volunteers };
  }

  getHello(): string {
    return 'Hello World!';
  }
}
