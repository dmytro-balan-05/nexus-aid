import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ForbiddenException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { GamificationService } from '../gamification/gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gamificationService: GamificationService,
  ) {}

  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get()
  async getAll(
    @Query('q') q: string,
    @Query('role') role: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.usersService.getAll(q, role);
  }

  @Get(':id')
  async getUserDetails(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.usersService.getUserDetails(id);
  }

  @Patch('me')
  updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch(':id/role')
  async changeRole(
    @Param('id') id: string,
    @Body() body: { role: 'user' | 'volonteer' },
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.usersService.changeRole(id, body.role, req.user);
  }

  @Delete(':id/badges/:badgeKey')
  async revokeBadge(
    @Param('id') userId: string,
    @Param('badgeKey') badgeKey: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.revokeBadge(userId, badgeKey);
  }
}
