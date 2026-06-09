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
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('badges')
  getAllBadges() {
    return this.gamificationService.getAllBadges();
  }

  @Get('leaderboard')
  getLeaderboard() {
    return this.gamificationService.getLeaderboard();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Request() req) {
    return this.gamificationService.getUserProfile(req.user.id);
  }

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
  @UseGuards(JwtAuthGuard)
  @Get('admin/badges')
  getAllBadgesAdmin(@Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.getAllBadges();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/badges')
  createBadge(@Request() req, @Body() body: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.createBadge(body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/badges/:key')
  updateBadge(@Request() req, @Param('key') key: string, @Body() body: any) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.updateBadge(key, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/badges/:key')
  deleteBadge(@Request() req, @Param('key') key: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.deleteBadge(key);
  }
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
