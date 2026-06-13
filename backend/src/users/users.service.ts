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
    if (!userId) throw new Error('Unauthorized');
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

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        donorProfile: {
          select: {
            level: true,
            totalAmount: true,
            donationCount: true,
            selectedFrame: true,
            selectedBackground: true,
            selectedFont: true,
            selectedBadgeId: true,
            quote: true,
          },
        },
        userBadges: {
          include: { badge: true },
          orderBy: { createdAt: 'desc' },
        },
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
      select: { id: true, email: true, name: true, role: true, avatar: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        provider: true,
        createdAt: true,
        donorProfile: true,
        userBadges: {
          include: { badge: true },
          orderBy: { createdAt: 'desc' },
        },
        donations: {
          where: { status: 'approved', donorId: { not: null } },
          include: {
            campaign: { select: { id: true, title: true, category: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changeRole(
    userId: string,
    role: 'user' | 'volonteer',
    currentUser: any,
  ) {
    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === currentUser.id)
      throw new ForbiddenException('You cannot change your own role');
    if (target.role === 'admin')
      throw new ForbiddenException('Cannot change admin role');
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.avatar !== undefined)
      data.avatar = dto.avatar === '' ? null : dto.avatar;
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

  async deleteUser(userId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    console.log(`[ADMIN] Deleting user ${user.email}. Reason: ${reason}`);

    // Видаляємо ВСІ повідомлення в чаті юзера (включно з адмінськими)
    const userChat = await this.prisma.chat.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (userChat) {
      await this.prisma.chatMessage.deleteMany({
        where: { chatId: userChat.id },
      });
    }
    await this.prisma.chat.deleteMany({ where: { userId } });

    await this.prisma.userBadge.deleteMany({ where: { userId } });
    await this.prisma.donorProfile.deleteMany({ where: { userId } });
    await this.prisma.donation.updateMany({
      where: { donorId: userId },
      data: { donorId: null },
    });

    const campaigns = await this.prisma.campaign.findMany({
      where: { authorId: userId },
      select: { id: true },
    });
    if (campaigns.length > 0) {
      const ids = campaigns.map((c) => c.id);
      await this.prisma.donation.deleteMany({
        where: { campaignId: { in: ids } },
      });
    }

    const verReq = await this.prisma.verificationRequest.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (verReq) {
      await this.prisma.verificationMessage.deleteMany({
        where: { requestId: verReq.id },
      });
    }
    await this.prisma.verificationMessage.deleteMany({
      where: { senderId: userId },
    });
    await this.prisma.verificationRequest.deleteMany({ where: { userId } });
    await this.prisma.campaign.deleteMany({ where: { authorId: userId } });
    await this.prisma.profileView.deleteMany({
      where: { OR: [{ viewerId: userId }, { targetId: userId }] },
    });
    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }
}
