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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiResponse({
    status: 201,
    description: 'Успішна реєстрація, повертає JWT токен',
  })
  @ApiResponse({ status: 400, description: 'Email вже зайнятий' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Вхід в акаунт' })
  @ApiResponse({
    status: 200,
    description: 'Успішний вхід, повертає access_token',
  })
  @ApiResponse({ status: 401, description: 'Невірні credentials' })
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

  @ApiOperation({ summary: 'Вихід з акаунту' })
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt');
    return { success: true };
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати WS токен для WebSocket підключення' })
  @UseGuards(JwtAuthGuard)
  @Get('ws-token')
  async getWsToken(@Request() req) {
    const token = await this.authService.getWsToken(req.user.id, req.user.role);
    return { token };
  }

  @Post('set-session')
  setSession(
    @Body() body: { token: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    res.cookie('jwt', body.token, { httpOnly: true, sameSite: 'lax' });
    return { success: true };
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати поточного користувача' })
  @ApiResponse({ status: 200, description: 'Дані поточного користувача' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req, @Res() res: Response) {
    const token = await this.authService.login(req.user);
    res.redirect(
      `https://nexus-aid-frontend-production.up.railway.app/auth/callback?token=${token.access_token}`,
    );
  }
}
