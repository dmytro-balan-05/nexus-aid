import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @ApiOperation({ summary: 'Список всіх бейджів' })
  @Get('badges')
  getAllBadges() {
    return this.gamificationService.getAllBadges();
  }

  @ApiOperation({ summary: 'Таблиця лідерів (топ-20 донорів)' })
  @Get('leaderboard')
  getLeaderboard() {
    return this.gamificationService.getLeaderboard();
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Мій профіль гейміфікації (бейджі, рівень)' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Request() req) {
    return this.gamificationService.getUserProfile(req.user.id);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Оновити кастомізацію картки донора' })
  @UseGuards(JwtAuthGuard)
  @Patch('me/customization')
  updateCustomization(
    @Request() req,
    @Body()
    body: {
      selectedFrame?: string;
      selectedBackground?: string;
      selectedFont?: string;
    },
  ) {
    return this.gamificationService.updateCustomization(req.user.id, body);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Список всіх бейджів' })
  @UseGuards(JwtAuthGuard)
  @Get('admin/badges')
  getAllBadgesAdmin(@Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.getAllBadges();
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Створити бейдж' })
  @UseGuards(JwtAuthGuard)
  @Post('admin/badges')
  createBadge(@Request() req, @Body() body: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.createBadge(body);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Оновити бейдж' })
  @UseGuards(JwtAuthGuard)
  @Patch('admin/badges/:key')
  updateBadge(@Request() req, @Param('key') key: string, @Body() body: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.updateBadge(key, body);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Видалити бейдж' })
  @UseGuards(JwtAuthGuard)
  @Delete('admin/badges/:key')
  deleteBadge(@Request() req, @Param('key') key: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.deleteBadge(key);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '[Admin] Видати бейдж вручну' })
  @UseGuards(JwtAuthGuard)
  @Post('admin/grant-badge')
  grantBadge(
    @Request() req,
    @Body() body: { userId: string; badgeKey: string },
  ) {
    return this.gamificationService.grantBadgeManually(
      body.userId,
      body.badgeKey,
      req.user.id,
    );
  }
}
