import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PrismaService } from '../prisma.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async create(createCampaignDto: CreateCampaignDto, authorId: string) {
    const campaign = await this.prisma.campaign.create({
      data: {
        title: createCampaignDto.title,
        shortDescription: createCampaignDto.shortDescription,
        fullDescription: createCampaignDto.fullDescription,
        goalAmount: createCampaignDto.goalAmount,
        location: createCampaignDto.location,
        beneficiary: createCampaignDto.beneficiary,
        category: createCampaignDto.category,
        images: createCampaignDto.images,
        documents: createCampaignDto.documents,
        isUrgent: createCampaignDto.isUrgent || false,
        urgentUntil: createCampaignDto.urgentUntil
          ? new Date(createCampaignDto.urgentUntil + 'T23:59:59.000Z')
          : null,
        status: 'active',
        authorId,
      },
    });

    await this.gamification.grantBadgeSystem(authorId, 'campaign_creator');

    return campaign;
  }

  async delete(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }

  async findAll(search?: string, sort?: 'asc' | 'desc', category?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    return this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
      include: {
        author: { select: { name: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async getUrgentByCategory() {
    const categories = ['military', 'medical', 'humanitarian', 'general'];
    const now = new Date();

    const results = await Promise.all(
      categories.map(async (cat) => {
        const campaign = await this.prisma.campaign.findFirst({
          where: {
            category: cat,
            status: 'active',
            isUrgent: true,
            urgentUntil: { gte: now },
          },
          orderBy: [{ urgentUntil: 'asc' }, { createdAt: 'asc' }],
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        });
        return { category: cat, campaign };
      }),
    );

    return results.filter((r) => r.campaign !== null);
  }

  async getRandomByCategory(category?: string) {
    const where: any = { status: 'active' };
    if (category) where.category = category;

    const count = await this.prisma.campaign.count({ where });
    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    const campaigns = await this.prisma.campaign.findMany({
      where,
      skip,
      take: 1,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return campaigns[0] || null;
  }

  async update(id: string, updateData: any, userId: string) {
    const currentCampaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!currentCampaign) throw new NotFoundException('Збір не знайдено');

    if (currentCampaign.authorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'admin') {
        throw new ForbiddenException('Ви не маєте права редагувати цей збір');
      }
    }

    const newImages =
      updateData.images && updateData.images.length > 0
        ? [...updateData.images, ...currentCampaign.images.slice(1)]
        : currentCampaign.images;

    const newDocuments = updateData.documents
      ? [...currentCampaign.documents, ...updateData.documents]
      : currentCampaign.documents;

    return this.prisma.campaign.update({
      where: { id },
      data: {
        title: updateData.title,
        shortDescription: updateData.shortDescription,
        fullDescription: updateData.fullDescription,
        goalAmount: updateData.goalAmount
          ? Number(updateData.goalAmount)
          : undefined,
        location: updateData.location,
        beneficiary: updateData.beneficiary,
        category: updateData.category,
        status: updateData.status,
        isUrgent:
          updateData.isUrgent !== undefined
            ? updateData.isUrgent === 'true' || updateData.isUrgent === true
            : undefined,
        urgentUntil: updateData.urgentUntil
          ? new Date(
              updateData.urgentUntil.includes('T')
                ? updateData.urgentUntil
                : updateData.urgentUntil + 'T23:59:59.000Z',
            )
          : undefined,
        images: newImages,
        documents: newDocuments,
      },
    });
  }
}
