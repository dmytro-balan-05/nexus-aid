import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { DonationsModule } from './donations/donations.module';
import { GamificationModule } from './gamification/gamification.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';
import { CampaignsModule } from './campaigns/campaigns.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    DonationsModule,
    AuthModule,
    UsersModule,
    GamificationModule,
    CampaignsModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
