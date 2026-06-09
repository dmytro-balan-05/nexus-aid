import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CampaignsScheduler {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredUrgentCampaigns() {
    const now = new Date();

    await this.prisma.campaign.updateMany({
      where: {
        isUrgent: true,
        urgentUntil: { lt: now },
      },
      data: {
        isUrgent: false,
        status: 'pending',
      },
    });
  }
}
