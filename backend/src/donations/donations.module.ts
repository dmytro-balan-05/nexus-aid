import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { PrismaService } from '../prisma.service';
import { GamificationModule } from '../gamification/gamification.module';


@Module({
  imports: [GamificationModule],
  controllers: [DonationsController],
  providers: [DonationsService, PrismaService],
})

export class DonationsModule {}
