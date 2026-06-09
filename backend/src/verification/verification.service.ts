import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async submitRequest(
    userId: string,
    data: {
      about: string;
      experience: string;
      socialLinks?: string;
      documents: string[];
    },
  ) {
    const existing = await this.prisma.verificationRequest.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'approved') {
        throw new BadRequestException('Ви вже верифіковані');
      }
      if (existing.status === 'pending') {
        throw new BadRequestException('Заявка вже на розгляді');
      }
      return this.prisma.verificationRequest.update({
        where: { userId },
        data: { ...data, status: 'pending' },
      });
    }

    return this.prisma.verificationRequest.create({
      data: { userId, ...data },
    });
  }

  async getMyRequest(userId: string) {
    return this.prisma.verificationRequest.findUnique({
      where: { userId },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getAllRequests(status?: string) {
    return this.prisma.verificationRequest.findMany({
      where: status ? { status: status as any } : {},
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestById(id: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) throw new NotFoundException('Заявку не знайдено');
    return request;
  }

  async sendMessage(
    requestId: string,
    senderId: string,
    text: string,
    isAdmin: boolean,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Заявку не знайдено');

    if (!isAdmin && request.userId !== senderId) {
      throw new ForbiddenException('Немає доступу');
    }

    return this.prisma.verificationMessage.create({
      data: { requestId, senderId, text, isAdmin },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    adminId: string,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!request) throw new NotFoundException('Заявку не знайдено');

    await this.prisma.verificationRequest.update({
      where: { id },
      data: { status },
    });

    if (status === 'approved') {
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { role: 'volonteer' },
      });
    }

    await this.prisma.verificationMessage.create({
      data: {
        requestId: id,
        senderId: adminId,
        isAdmin: true,
        text:
          status === 'approved'
            ? '✅ Вашу заявку підтверджено. Вітаємо, ви тепер верифікований волонтер!'
            : '❌ На жаль, вашу заявку відхилено. Ви можете подати нову заявку з оновленою інформацією.',
      },
    });

    return { status };
  }
}
