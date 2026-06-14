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
    name: 'Гуманіст',
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

  private leaderboardCache: { data: any; expiresAt: number } | null = null;

  invalidateLeaderboardCache() {
    this.leaderboardCache = null;
  }

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

  async processAfterDonation(
    userId: string,
    campaignCategory: string,
    donationAmount: number,
    campaignId: string,
  ) {
    const allDonations = await this.prisma.donation.findMany({
      where: { donorId: userId, status: 'approved' },
      include: {
        campaign: {
          select: { category: true, isUrgent: true, urgentUntil: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = allDonations.reduce((s, d) => s + d.amount, 0);
    const totalCount = allDonations.length;
    const newLevel = this.calculateLevel(totalAmount);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const currentProfile = await this.prisma.donorProfile.findUnique({
      where: { userId },
    });

    let currentDayStreak = 1;
    let longestDayStreak = currentProfile?.longestDayStreak ?? 1;
    let currentMonthStreak = 1;
    let isComeback = false;

    if (currentProfile?.lastDonationDate) {
      const last = new Date(currentProfile.lastDonationDate);
      const lastDay = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate(),
      );
      const diffDays = Math.floor(
        (today.getTime() - lastDay.getTime()) / 86400000,
      );

      if (diffDays === 0) {
        currentDayStreak = currentProfile.currentDayStreak;
      } else if (diffDays === 1) {
        currentDayStreak = (currentProfile.currentDayStreak ?? 0) + 1;
      } else {
        currentDayStreak = 1;
      }

      longestDayStreak = Math.max(longestDayStreak, currentDayStreak);

      const monthDiff =
        (now.getFullYear() - last.getFullYear()) * 12 +
        (now.getMonth() - last.getMonth());

      if (monthDiff === 0) {
        currentMonthStreak = currentProfile.currentMonthStreak;
      } else if (monthDiff === 1) {
        currentMonthStreak = (currentProfile.currentMonthStreak ?? 0) + 1;
      } else {
        currentMonthStreak = 1;
      }

      isComeback = diffDays >= 30;
    }

    await this.prisma.donorProfile.upsert({
      where: { userId },
      update: {
        level: newLevel,
        totalAmount,
        donationCount: totalCount,
        currentDayStreak,
        longestDayStreak,
        currentMonthStreak,
        lastDonationDate: now,
      },
      create: {
        userId,
        level: newLevel,
        totalAmount,
        donationCount: totalCount,
        currentDayStreak: 1,
        longestDayStreak: 1,
        currentMonthStreak: 1,
        lastDonationDate: now,
      },
    });

    const badges: string[] = [];

    if (totalCount >= 1) badges.push('first_donation');
    if (totalCount >= 5) badges.push('donations_5');
    if (totalCount >= 10) badges.push('donations_10');
    if (totalCount >= 25) badges.push('donations_25');
    if (totalCount >= 50) badges.push('donations_50');
    if (totalCount >= 100) badges.push('donations_100');

    if (totalAmount >= 1000) badges.push('total_1k');
    if (totalAmount >= 5000) badges.push('total_5k');
    if (totalAmount >= 10000) badges.push('total_10k');
    if (totalAmount >= 50000) badges.push('total_50k');
    if (totalAmount >= 100000) badges.push('total_100k');

    if (donationAmount >= 1000) badges.push('big_one_1k');
    if (donationAmount >= 5000) badges.push('big_one_5k');
    if (donationAmount >= 10000) badges.push('big_one_10k');

    if (donationAmount % 1000 === 0) badges.push('round_number');
    if (String(donationAmount).includes('7')) badges.push('lucky_7');

    const amountStr = String(donationAmount);
    if (
      amountStr.length > 1 &&
      amountStr === amountStr.split('').reverse().join('')
    ) {
      badges.push('palindrome');
    }

    if (donationAmount === 777 || donationAmount === 1337)
      badges.push('phantom');

    const byCategory = (cat: string) =>
      allDonations.filter((d) => d.campaign.category === cat);

    const military = byCategory('military');
    if (military.length >= 1) badges.push('first_drone');
    if (military.length >= 5) badges.push('drone_x5');
    if (military.reduce((s, d) => s + d.amount, 0) >= 50000)
      badges.push('heavy_support');

    const medical = byCategory('medical');
    if (medical.length >= 1) badges.push('first_aid');
    if (medical.length >= 5) badges.push('field_medic');
    if (medical.reduce((s, d) => s + d.amount, 0) >= 15000)
      badges.push('ambulance');

    const humanitarian = byCategory('humanitarian');
    if (humanitarian.length >= 1) badges.push('first_step_humanitarian');
    if (humanitarian.length >= 5) badges.push('volunteer_heart');
    if (humanitarian.reduce((s, d) => s + d.amount, 0) >= 20000)
      badges.push('pillar');

    const uniqueCategories = new Set(
      allDonations.map((d) => d.campaign.category),
    );
    if (uniqueCategories.size >= 3) badges.push('triple_category');
    if (uniqueCategories.size >= 4) badges.push('all_categories');

    const hour = now.getHours();
    if (hour >= 0 && hour < 5) badges.push('night_owl');
    if (hour >= 6 && hour < 8) badges.push('early_bird');
    if (now.getMonth() === 1 && now.getDate() === 24)
      badges.push('ukraine_day');
    if (now.getMonth() === 7 && now.getDate() === 24)
      badges.push('independence_day');

    const todayDonations = allDonations.filter((d) => {
      const d2 = new Date(d.createdAt);
      return (
        d2.getFullYear() === today.getFullYear() &&
        d2.getMonth() === today.getMonth() &&
        d2.getDate() === today.getDate()
      );
    });
    if (todayDonations.length >= 3) badges.push('speed_donor');

    const weekendDonations = allDonations.filter((d) => {
      const day = new Date(d.createdAt).getDay();
      return day === 0 || day === 6;
    });
    if (weekendDonations.length >= 5) badges.push('weekend_warrior');

    if (currentDayStreak >= 3) badges.push('streak_3');
    if (currentDayStreak >= 7) badges.push('streak_7');
    if (isComeback) badges.push('comeback');
    if (currentMonthStreak >= 3) badges.push('monthly_regular');
    if (currentMonthStreak >= 6) badges.push('marathon');

    const byCampaign = allDonations.reduce(
      (acc, d) => {
        acc[d.campaignId] = (acc[d.campaignId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    if (Object.values(byCampaign).some((count: number) => count >= 5))
      badges.push('loyal');

    const urgentDonations = allDonations.filter(
      (d) =>
        d.campaign.isUrgent &&
        d.campaign.urgentUntil &&
        new Date(d.createdAt) <= new Date(d.campaign.urgentUntil),
    );
    const uniqueUrgentCampaigns = new Set(
      urgentDonations.map((d) => d.campaignId),
    );
    if (uniqueUrgentCampaigns.size >= 5) badges.push('crisis_savior');

    const lastStandDonations = allDonations.filter((d) => {
      if (!d.campaign.isUrgent || !d.campaign.urgentUntil) return false;
      const urgentUntilMs = new Date(d.campaign.urgentUntil).getTime();
      const donMs = new Date(d.createdAt).getTime();
      return urgentUntilMs - donMs <= 3 * 60 * 60 * 1000;
    });
    if (lastStandDonations.length >= 3) badges.push('last_stand');

    const leaderboard = await this.prisma.donorProfile.findMany({
      orderBy: { totalAmount: 'desc' },
      take: 10,
      select: { userId: true },
    });
    const position = leaderboard.findIndex((p) => p.userId === userId);
    if (position >= 0 && position < 3) badges.push('top3_leaderboard');
    if (position === 0) badges.push('top1_leaderboard');

    const badgeCount = await this.prisma.userBadge.count({ where: { userId } });
    if (
      newLevel === 'platinum' &&
      position >= 0 &&
      position < 10 &&
      badgeCount >= 15
    ) {
      badges.push('elite_club');
    }

    for (const key of badges) {
      await this.grantBadgeSystem(userId, key);
    }

    this.invalidateLeaderboardCache();
  }

  async processAfterProfileUpdate(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const profile = await this.prisma.donorProfile.findUnique({
      where: { userId },
    });

    if (user?.avatar) await this.grantBadgeSystem(userId, 'avatar_set');
    if (profile?.quote) await this.grantBadgeSystem(userId, 'quote_master');

    if (
      user?.avatar &&
      profile?.quote &&
      profile?.selectedFrame &&
      profile?.selectedBackground &&
      profile?.selectedFont &&
      profile?.selectedBadgeId
    ) {
      await this.grantBadgeSystem(userId, 'perfectionist');
    }
  }

  async processProfileView(viewerId: string, targetId: string) {
    if (viewerId === targetId) return;

    await this.prisma.profileView.create({
      data: { viewerId, targetId },
    });

    const uniqueViewed = await this.prisma.profileView.groupBy({
      by: ['targetId'],
      where: { viewerId },
    });
    if (uniqueViewed.length >= 20) {
      await this.grantBadgeSystem(viewerId, 'social_butterfly');
    }

    const totalViews = await this.prisma.profileView.count({
      where: { targetId },
    });
    if (totalViews >= 50) {
      await this.grantBadgeSystem(targetId, 'inspiration');
    }
  }

  async processAfterCampaignFunded(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { authorId: true, currentAmount: true, goalAmount: true },
    });

    if (!campaign) return;
    if (campaign.currentAmount < campaign.goalAmount) return;

    await this.grantBadgeSystem(campaign.authorId, 'campaign_funded');
    await this.grantBadgeSystem(campaign.authorId, 'architect');

    const earlyDonations = await this.prisma.donation.findMany({
      where: {
        campaignId,
        status: 'approved',
        campaignProgressAtDonation: { lt: 10 },
      },
      select: { donorId: true },
    });

    for (const d of earlyDonations) {
      if (d.donorId) {
        await this.grantBadgeSystem(d.donorId, 'early_supporter');
      }
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
      selectedBadgeId?: string;
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

    if (data.selectedBadgeId) {
      const badge = await this.prisma.badge.findFirst({
        where: {
          OR: [{ key: data.selectedBadgeId }, { id: data.selectedBadgeId }],
        },
      });
      if (!badge) throw new ForbiddenException('Цей бейдж не розблоковано');
      const hasBadge = userBadges.some((ub) => ub.badgeId === badge.id);
      if (!hasBadge) throw new ForbiddenException('Цей бейдж не розблоковано');
      data.selectedBadgeId = badge.id;
    }

    const currentProfile = await this.prisma.donorProfile.findUnique({
      where: { userId },
    });
    const newCount = (currentProfile?.customizationChangeCount ?? 0) + 1;

    const result = await this.prisma.donorProfile.upsert({
      where: { userId },
      update: { ...data, customizationChangeCount: newCount },
      create: { userId, ...data, customizationChangeCount: 1 },
    });

    await this.grantBadgeSystem(userId, 'card_customizer');
    if (newCount >= 10) await this.grantBadgeSystem(userId, 'style_icon');
    if (data.quote) await this.grantBadgeSystem(userId, 'quote_master');

    await this.processAfterProfileUpdate(userId);

    return result;
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
    const now = Date.now();

    if (this.leaderboardCache && this.leaderboardCache.expiresAt > now) {
      return this.leaderboardCache.data;
    }

    const profiles = await this.prisma.donorProfile.findMany({
      orderBy: { totalAmount: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const withBadges = await Promise.all(
      profiles.map(async (p) => {
        const badgeCount = await this.prisma.userBadge.count({
          where: { userId: p.userId },
        });
        return { ...p, badgeCount };
      }),
    );

    this.leaderboardCache = {
      data: withBadges,
      expiresAt: now + 5 * 60 * 1000,
    };

    return withBadges;
  }

  async getAllBadges() {
    return this.prisma.badge.findMany({ orderBy: { category: 'asc' } });
  }
}
