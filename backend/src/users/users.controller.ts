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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { GamificationService } from '../gamification/gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly gamificationService: GamificationService,
  ) {}

  @ApiOperation({ summary: 'Мій профіль' })
  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: 'Публічний профіль користувача' })
  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string, @Request() req) {
    await this.gamificationService.processProfileView(req.user.id, id);
    return this.usersService.getPublicProfile(id);
  }

  @ApiOperation({ summary: '[Admin] Список всіх користувачів' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['user', 'volonteer', 'admin'],
  })
  @Get()
  async getAll(
    @Query('q') q: string,
    @Query('role') role: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.usersService.getAll(q, role);
  }

  @ApiOperation({ summary: '[Admin] Деталі користувача' })
  @Get(':id')
  async getUserDetails(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.usersService.getUserDetails(id);
  }

  @ApiOperation({ summary: 'Оновити свій профіль' })
  @Patch('me')
  async updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    const result = await this.usersService.updateProfile(req.user.id, dto);
    await this.gamificationService.processAfterProfileUpdate(req.user.id);
    return result;
  }

  @ApiOperation({ summary: '[Admin] Змінити роль користувача' })
  @Patch(':id/role')
  async changeRole(
    @Param('id') id: string,
    @Body() body: { role: 'user' | 'volonteer' },
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.usersService.changeRole(id, body.role, req.user);
  }

  @ApiOperation({ summary: '[Admin] Відкликати бейдж у користувача' })
  @Delete(':id/badges/:badgeKey')
  async revokeBadge(
    @Param('id') userId: string,
    @Param('badgeKey') badgeKey: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.gamificationService.revokeBadge(userId, badgeKey);
  }

  @ApiOperation({ summary: '[Admin] Видалити користувача' })
  @ApiQuery({ name: 'reason', required: false })
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    if (req.user.id === id)
      throw new ForbiddenException('Cannot delete yourself');
    return this.usersService.deleteUser(id, reason || 'No reason provided');
  }
}
