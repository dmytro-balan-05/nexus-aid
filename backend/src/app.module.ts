import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static'; // Імпортуємо модуль
import { join } from 'path'; // Для роботи зі шляхами
import { DonationsModule } from './donations/donations.module';

import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';
import { CampaignsModule } from './campaigns/campaigns.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    DonationsModule,
    AuthModule,
    UsersModule,

    CampaignsModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}