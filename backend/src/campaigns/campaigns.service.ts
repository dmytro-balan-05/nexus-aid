import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async create(createCampaignDto: CreateCampaignDto, authorId: string) {
    return this.prisma.campaign.create({
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

        status: 'active',
        authorId: authorId,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.campaign.delete({
      where: { id },
    });
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
      orderBy: {
        createdAt: sort === 'asc' ? 'asc' : 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  // --- МЕТОД UPDATE З ПРАВАМИ АДМІНА ---
  async update(id: string, updateData: any, userId: string) {
    // <--- ТУТ БУВ ERROR
    const currentCampaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!currentCampaign) {
      throw new NotFoundException('Збір не знайдено');
    }

    // 1. Якщо ти не автор...
    if (currentCampaign.authorId !== userId) {
      // 2. ...перевіряємо, чи ти Адмін (Enum має бути великими, якщо в базі так)
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      // Якщо ролі в базі 'ADMIN' - то ок, інакше - помилка
      if (!user || user.role !== 'admin') {
        throw new ForbiddenException('Ви не маєте права редагувати цей збір');
      }
    }

    const newImages = updateData.images
      ? [...currentCampaign.images, ...updateData.images]
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
        images: newImages,
        documents: newDocuments,
      },
    });
  }

  remove(id: string) {
    return `This action removes a #${id} campaign`;
  }
}
