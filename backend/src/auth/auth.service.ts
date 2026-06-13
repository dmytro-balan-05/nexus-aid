import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { GamificationService } from '../gamification/gamification.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private gamification: GamificationService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
      role: user.role,
      name: user.name,
    };
  }

  async register(dto: RegisterDto) {
    const oldUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (oldUser)
      throw new BadRequestException('Користувач з таким email вже існує');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const avatarSeed = encodeURIComponent(dto.name);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        isVerified: true,
      },
    });

    await this.gamification.grantBadgeSystem(user.id, 'welcome');
    return this.login(user);
  }

  async validateOAuthUser(data: {
    email: string;
    name: string;
    avatar?: string;
    provider: string;
    socialId: string;
  }) {
    let user = await this.prisma.user.findFirst({
      where: { provider: data.provider, socialId: data.socialId },
    });

    if (!user && data.email) {
      user = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { provider: data.provider, socialId: data.socialId },
        });
      }
    }

    if (!user) {
      const avatarSeed = encodeURIComponent(data.name || data.email || 'user');
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          avatar:
            data.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
          provider: data.provider,
          socialId: data.socialId,
          isVerified: true,
        },
      });
      await this.gamification.grantBadgeSystem(user.id, 'welcome');
    }

    return user;
  }

  async getWsToken(userId: string, role: string): Promise<string> {
    return this.jwtService.sign({ sub: userId, role }, { expiresIn: '24h' });
  }
}
