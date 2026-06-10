import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async getOrCreateChat(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'volonteer')
      throw new ForbiddenException('Only volunteers can use chat');

    return this.prisma.chat.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async sendMessage(userId: string, text: string, isAdmin: boolean) {
    if (isAdmin) throw new ForbiddenException('Admin must specify chatId');

    const chat = await this.prisma.chat.findUnique({ where: { userId } });
    if (!chat) throw new NotFoundException('Chat not found');

    const message = await this.prisma.chatMessage.create({
      data: { chatId: chat.id, senderId: userId, text, isAdmin, isRead: false },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    const messageCount = await this.prisma.chatMessage.count({
      where: { senderId: userId, isAdmin: false },
    });
    if (messageCount >= 10) {
      await this.gamification.grantBadgeSystem(userId, 'chat_active');
    }

    return message;
  }

  async sendMessageAdmin(chatId: string, adminId: string, text: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    return this.prisma.chatMessage.create({
      data: { chatId, senderId: adminId, text, isAdmin: true, isRead: false },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async markAsRead(userId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { userId } });
    if (!chat) return;

    await this.prisma.chatMessage.updateMany({
      where: { chatId: chat.id, isAdmin: true, isRead: false },
      data: { isRead: true },
    });
  }

  async markAsReadAdmin(chatId: string) {
    await this.prisma.chatMessage.updateMany({
      where: { chatId, isAdmin: false, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const chat = await this.prisma.chat.findUnique({ where: { userId } });
    if (!chat) return 0;

    return this.prisma.chatMessage.count({
      where: { chatId: chat.id, isAdmin: true, isRead: false },
    });
  }

  async getChatById(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async getAllChats() {
    const chats = await this.prisma.chat.findMany({
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.prisma.chatMessage.count({
          where: { chatId: chat.id, isAdmin: false, isRead: false },
        });
        return { ...chat, unreadCount };
      }),
    );
  }
}
