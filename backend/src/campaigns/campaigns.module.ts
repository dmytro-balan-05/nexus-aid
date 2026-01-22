import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { PrismaService } from '../prisma.service'; // <--- 1. Імпортуй сервіс

@Module({
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    PrismaService,
  ],
})
export class CampaignsModule {}
