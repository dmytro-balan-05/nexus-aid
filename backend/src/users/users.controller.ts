import {
  Controller,
  Get,
  Patch,
  Body,
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

  @Get('me')
  getMe(@Request() req) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.userId, updateUserDto);
  }
}
