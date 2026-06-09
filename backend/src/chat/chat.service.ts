import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
    let chat;

    if (isAdmin) {
      throw new ForbiddenException('Admin must specify chatId');
    }

    chat = await this.prisma.chat.findUnique({ where: { userId } });
    if (!chat) throw new NotFoundException('Chat not found');

    return this.prisma.chatMessage.create({
      data: { chatId: chat.id, senderId: userId, text, isAdmin },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async sendMessageAdmin(chatId: string, adminId: string, text: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    return this.prisma.chatMessage.create({
      data: { chatId, senderId: adminId, text, isAdmin: true },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
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
    return this.prisma.chat.findMany({
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
