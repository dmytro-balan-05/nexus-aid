import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { GamificationService } from '../gamification/gamification.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private gamification: GamificationService,
    private mail: MailService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    if (!user.isVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }
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
    if (oldUser) {
      throw new BadRequestException('Користувач з таким email вже існує');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const avatarSeed = encodeURIComponent(dto.name);
    const code = this.generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        isVerified: false,
        verificationCode: code,
        verificationExpiry: expiry,
      },
    });

    await this.mail.sendVerificationCode(dto.email, code);

    return { requiresVerification: true, email: dto.email };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new BadRequestException('Користувача не знайдено');
    if (user.isVerified)
      throw new BadRequestException('Email вже підтверджений');
    if (!user.verificationCode || user.verificationCode !== code) {
      throw new BadRequestException('Невірний код');
    }
    if (user.verificationExpiry && user.verificationExpiry < new Date()) {
      throw new BadRequestException('Код застарів');
    }

    const updated = await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpiry: null,
      },
    });

    await this.gamification.grantBadgeSystem(updated.id, 'welcome');
    return this.login(updated);
  }

  async resendCode(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Користувача не знайдено');
    if (user.isVerified)
      throw new BadRequestException('Email вже підтверджений');

    const code = this.generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: { verificationCode: code, verificationExpiry: expiry },
    });

    await this.mail.sendVerificationCode(email, code);
    return { success: true };
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
}
