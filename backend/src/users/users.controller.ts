import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Param,
  ForbiddenException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(
    @Query('q') q: string,
    @Query('role') role: string,
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin');
    }
    return this.usersService.getAll(q, role);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/role')
  async changeRole(
    @Param('id') id: string,
    @Body() body: { role: 'user' | 'volonteer' },
    @Request() req,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin');
    }

    return this.usersService.changeRole(id, body.role, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}
