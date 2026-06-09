import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DonorLevel } from '@prisma/client';

const LEVEL_THRESHOLDS: Record<DonorLevel, number> = {
  bronze: 0,
  silver: 5000,
  gold: 25000,
  platinum: 100000,
};

const BADGES = [
  {
    key: 'welcome',
    name: 'Ласкаво просимо',
    description: 'Приєднався до платформи NexusAid',
    icon: '🎉',
    category: 'general',
    unlocksFrame: 'frame_star',
    unlocksBackground: '#f8fafc',
    unlocksFont: 'font_default',
  },
  {
    key: 'first_donation',
    name: 'Перший крок',
    description: 'Зробив свій перший донат',
    icon: '⭐',
    category: 'general',
    unlocksFrame: 'frame_star',
    unlocksBackground: '#f5f5f5',
    unlocksFont: 'font_default',
  },
  {
    key: 'total_10k',
    name: 'Меценат',
    description: 'Загальна сума донатів понад 10 000 ₴',
    icon: '💎',
    category: 'general',
    unlocksFrame: 'frame_diamond',
    unlocksBackground: '#e8f4fd',
    unlocksFont: 'font_elegant',
  },
  {
    key: 'total_100k',
    name: 'Легенда',
    description: 'Загальна сума донатів понад 100 000 ₴',
    icon: '👑',
    category: 'general',
    unlocksFrame: 'frame_crown',
    unlocksBackground: '#fef9e7',
    unlocksFont: 'font_bold',
  },
  {
    key: 'first_drone',
    name: 'Перші крила',
    description: 'Перший донат у військову категорію',
    icon: '🚁',
    category: 'military',
    unlocksFrame: 'frame_drone',
    unlocksBackground: '#1a1a2e',
    unlocksFont: 'font_military',
  },
  {
    key: 'drone_x5',
    name: 'Крила перемоги',
    description: '5 донатів у військову категорію',
    icon: '✈️',
    category: 'military',
    unlocksFrame: 'frame_wings',
    unlocksBackground: '#0d1b2a',
    unlocksFont: 'font_bold',
  },
  {
    key: 'heavy_support',
    name: 'Важка підтримка',
    description: 'Задонатив 50 000+ ₴ у військову категорію',
    icon: '🛡️',
    category: 'military',
    unlocksFrame: 'frame_shield',
    unlocksBackground: '#1b2838',
    unlocksFont: 'font_military',
  },
  {
    key: 'first_aid',
    name: 'Перша допомога',
    description: 'Перший донат у медичну категорію',
    icon: '🩺',
    category: 'medical',
    unlocksFrame: 'frame_cross',
    unlocksBackground: '#fff5f5',
    unlocksFont: 'font_default',
  },
  {
    key: 'field_medic',
    name: 'Польовий медик',
    description: '5 донатів у медичну категорію',
    icon: '💉',
    category: 'medical',
    unlocksFrame: 'frame_medic',
    unlocksBackground: '#ffe8e8',
    unlocksFont: 'font_elegant',
  },
  {
    key: 'ambulance',
    name: 'Машина життя',
    description: 'Задонатив 15 000+ ₴ у медичну категорію',
    icon: '🚑',
    category: 'medical',
    unlocksFrame: 'frame_ambulance',
    unlocksBackground: '#ff4444',
    unlocksFont: 'font_bold',
  },
  {
    key: 'first_step_humanitarian',
    name: 'Перший гуманітарний крок',
    description: 'Перший донат у гуманітарну категорію',
    icon: '🤝',
    category: 'humanitarian',
    unlocksFrame: 'frame_hands',
    unlocksBackground: '#f0fff4',
    unlocksFont: 'font_default',
  },
  {
    key: 'volunteer_heart',
    name: 'Серце волонтера',
    description: '5 донатів у гуманітарну категорію',
    icon: '❤️',
    category: 'humanitarian',
    unlocksFrame: 'frame_heart',
    unlocksBackground: '#fff0f3',
    unlocksFont: 'font_elegant',
  },
  {
    key: 'pillar',
    name: 'Стовп громади',
    description: 'Задонатив 20 000+ ₴ у гуманітарну категорію',
    icon: '🏛️',
    category: 'humanitarian',
    unlocksFrame: 'frame_pillar',
    unlocksBackground: '#fffbeb',
    unlocksFont: 'font_bold',
  },
];

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async seedBadges() {
    for (const badge of BADGES) {
      await this.prisma.badge.upsert({
        where: { key: badge.key },
        update: badge,
        create: badge,
      });
    }
  }

  private calculateLevel(totalAmount: number): DonorLevel {
    if (totalAmount >= LEVEL_THRESHOLDS.platinum) return 'platinum';
    if (totalAmount >= LEVEL_THRESHOLDS.gold) return 'gold';
    if (totalAmount >= LEVEL_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  async processAfterDonation(userId: string, campaignCategory: string) {
    const allDonations = await this.prisma.donation.findMany({
      where: { donorId: userId, status: 'approved' },
      include: { campaign: { select: { category: true } } },
    });

    const totalAmount = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalCount = allDonations.length;

    const byCategory = (cat: string) =>
      allDonations.filter((d) => d.campaign.category === cat);

    const newLevel = this.calculateLevel(totalAmount);

    await this.prisma.donorProfile.upsert({
      where: { userId },
      update: { level: newLevel, totalAmount, donationCount: totalCount },
      create: {
        userId,
        level: newLevel,
        totalAmount,
        donationCount: totalCount,
      },
    });

    const badgesToCheck: string[] = [];

    if (totalCount === 1) badgesToCheck.push('first_donation');
    if (totalAmount >= 10000) badgesToCheck.push('total_10k');
    if (totalAmount >= 100000) badgesToCheck.push('total_100k');

    const militaryDonations = byCategory('military');
    if (militaryDonations.length === 1) badgesToCheck.push('first_drone');
    if (militaryDonations.length >= 5) badgesToCheck.push('drone_x5');
    if (militaryDonations.reduce((s, d) => s + d.amount, 0) >= 50000)
      badgesToCheck.push('heavy_support');

    const medicalDonations = byCategory('medical');
    if (medicalDonations.length === 1) badgesToCheck.push('first_aid');
    if (medicalDonations.length >= 5) badgesToCheck.push('field_medic');
    if (medicalDonations.reduce((s, d) => s + d.amount, 0) >= 15000)
      badgesToCheck.push('ambulance');

    const humanitarianDonations = byCategory('humanitarian');
    if (humanitarianDonations.length === 1)
      badgesToCheck.push('first_step_humanitarian');
    if (humanitarianDonations.length >= 5)
      badgesToCheck.push('volunteer_heart');
    if (humanitarianDonations.reduce((s, d) => s + d.amount, 0) >= 20000)
      badgesToCheck.push('pillar');

    for (const key of badgesToCheck) {
      await this.grantBadgeSystem(userId, key);
    }
  }

  async grantBadgeManually(
    targetUserId: string,
    badgeKey: string,
    adminId: string,
  ) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'admin')
      throw new ForbiddenException('Only admin');

    const badge = await this.prisma.badge.findUnique({
      where: { key: badgeKey },
    });
    if (!badge) throw new NotFoundException('Badge not found');

    return this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: targetUserId, badgeId: badge.id } },
      update: {},
      create: { userId: targetUserId, badgeId: badge.id, grantedBy: adminId },
    });
  }

  async grantBadgeSystem(targetUserId: string, badgeKey: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { key: badgeKey },
    });
    if (!badge) return;

    return this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: targetUserId, badgeId: badge.id } },
      update: {},
      create: { userId: targetUserId, badgeId: badge.id, grantedBy: null },
    });
  }

  async getUserProfile(userId: string) {
    const profile = await this.prisma.donorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { createdAt: 'desc' },
    });

    return { profile, badges: userBadges.map((ub) => ub.badge) };
  }

  async updateCustomization(
    userId: string,
    data: {
      selectedFrame?: string;
      selectedBackground?: string;
      selectedFont?: string;
      quote?: string;
    },
  ) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    const unlockedFrames = userBadges
      .map((ub) => ub.badge.unlocksFrame)
      .filter(Boolean);
    const unlockedBackgrounds = userBadges
      .map((ub) => ub.badge.unlocksBackground)
      .filter(Boolean);
    const unlockedFonts = userBadges
      .map((ub) => ub.badge.unlocksFont)
      .filter(Boolean);

    if (data.selectedFrame && !unlockedFrames.includes(data.selectedFrame))
      throw new ForbiddenException('Цю рамку ще не розблоковано');
    if (
      data.selectedBackground &&
      !unlockedBackgrounds.includes(data.selectedBackground)
    )
      throw new ForbiddenException('Цей фон ще не розблоковано');
    if (data.selectedFont && !unlockedFonts.includes(data.selectedFont))
      throw new ForbiddenException('Цей шрифт ще не розблоковано');

    return this.prisma.donorProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async createBadge(data: any) {
    return this.prisma.badge.create({ data });
  }

  async updateBadge(key: string, data: any) {
    return this.prisma.badge.update({ where: { key }, data });
  }

  async deleteBadge(key: string) {
    return this.prisma.badge.delete({ where: { key } });
  }
  async revokeBadge(userId: string, badgeKey: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { key: badgeKey },
    });
    if (!badge) throw new NotFoundException('Badge not found');

    return this.prisma.userBadge.delete({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
  }
  async getLeaderboard() {
    return this.prisma.donorProfile.findMany({
      orderBy: { totalAmount: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getAllBadges() {
    return this.prisma.badge.findMany({ orderBy: { category: 'asc' } });
  }
}
