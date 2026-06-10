import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsScheduler } from './campaigns.scheduler';
import { PrismaService } from '../prisma.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsScheduler, PrismaService],
})
export class CampaignsModule {}
