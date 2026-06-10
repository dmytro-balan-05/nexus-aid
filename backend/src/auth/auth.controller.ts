import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Request() req,
    @Body() _loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(req.user);
    res.cookie('jwt', token.access_token, { httpOnly: true, sameSite: 'lax' });
    return token;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Request() req, @Res() res: Response) {
    const token = await this.authService.login(req.user);
    res.cookie('jwt', token.access_token, { httpOnly: true, sameSite: 'lax' });
    res.redirect(
      'https://nexus-aid-frontend-production.up.railway.app/profile',
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req, @Res() res: Response) {
    const token = await this.authService.login(req.user);
    res.cookie('jwt', token.access_token, { httpOnly: true, sameSite: 'lax' });
    res.redirect(
      'https://nexus-aid-frontend-production.up.railway.app/profile',
    );
  }
}
