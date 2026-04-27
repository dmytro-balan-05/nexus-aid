import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        provider: true,
        socialId: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async getAll(q?: string, role?: string) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          role ? { role: role as any } : {},
          q
            ? {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async changeRole(
    userId: string,
    role: 'user' | 'volonteer',
    currentUser: any,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.id === currentUser.id) {
      throw new ForbiddenException('You cannot change your own role');
    }

    if (target.role === 'admin') {
      throw new ForbiddenException('Cannot change admin role');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
  async updateProfile(userId: string, dto: UpdateUserDto) {
    const data: any = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.avatar !== undefined) {
      data.avatar = dto.avatar === '' ? null : dto.avatar;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });
  }
}
