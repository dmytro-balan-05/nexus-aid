import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsScheduler } from './campaigns.scheduler';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsScheduler, PrismaService],
})
export class CampaignsModule {}
