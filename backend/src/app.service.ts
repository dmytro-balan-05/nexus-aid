import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getStats() {
    const [campaigns, donations, volunteers] = await Promise.all([
      this.prisma.campaign.count({ where: { status: 'active' } }),
      this.prisma.donation.count({ where: { status: 'approved' } }),
      this.prisma.user.count({ where: { role: 'volonteer' } }),
    ]);
    return { campaigns, donations, volunteers };
  }
}
