import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InitiateDonationDto } from './dto/initiate-donation.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class DonationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private gamification: GamificationService,
  ) {}

  private getSecretKey(): string {
    const key = this.config.get<string>('WFP_SECRET_KEY');
    if (!key) throw new Error('WFP_SECRET_KEY не вказано в .env');
    return key;
  }

  private generateOrderReference(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NEXUSAID_${timestamp}_${random}`;
  }

  private generateSignature(params: string[]): string {
    return crypto
      .createHmac('md5', this.getSecretKey())
      .update(params.join(';'))
      .digest('hex');
  }

  async initiate(dto: InitiateDonationDto, userId?: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    });

    if (!campaign) throw new NotFoundException('Кампанію не знайдено');
    if (campaign.status !== 'active')
      throw new BadRequestException('Кампанія не активна');

    const orderReference = this.generateOrderReference();
    const orderDate = Math.floor(Date.now() / 1000);
    const merchantAccount = this.config.get<string>('WFP_MERCHANT_ACCOUNT')!;
    const merchantDomain = this.config.get<string>('WFP_MERCHANT_DOMAIN')!;
    const returnUrl = this.config.get<string>('WFP_RETURN_URL')!;
    const serviceUrl = this.config.get<string>('WFP_SERVICE_URL')!;

    const progressAtDonation =
      campaign.goalAmount > 0
        ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100)
        : 0;

    await this.prisma.donation.create({
      data: {
        amount: dto.amount,
        orderReference,
        status: 'pending',
        campaignId: dto.campaignId,
        donorId: userId || null,
        donorName: dto.donorName || null,
        donorEmail: dto.donorEmail || null,
        campaignProgressAtDonation: progressAtDonation,
      },
    });

    const merchantSignature = this.generateSignature([
      merchantAccount,
      merchantDomain,
      orderReference,
      String(orderDate),
      String(dto.amount),
      'UAH',
      campaign.title,
      '1',
      String(dto.amount),
    ]);

    return {
      orderReference,
      merchantAccount,
      merchantDomain,
      merchantSignature,
      orderDate,
      amount: dto.amount,
      currency: 'UAH',
      productName: campaign.title,
      returnUrl,
      serviceUrl,
    };
  }

  async verifyReturn(params: Record<string, string>) {
    const { orderReference, transactionStatus } = params;

    if (!orderReference)
      throw new BadRequestException('Missing orderReference');

    const donation = await this.prisma.donation.findUnique({
      where: { orderReference },
      include: { campaign: { select: { category: true } } },
    });

    if (!donation) {
      console.error('[VERIFY RETURN] Донат не знайдено:', orderReference);
      throw new NotFoundException('Донат не знайдено');
    }

    if (donation.status === 'approved') {
      return { success: true, alreadyProcessed: true };
    }

    if (transactionStatus === 'Approved') {
      await this.prisma.$transaction([
        this.prisma.donation.update({
          where: { orderReference },
          data: { status: 'approved' },
        }),
        this.prisma.campaign.update({
          where: { id: donation.campaignId },
          data: { currentAmount: { increment: donation.amount } },
        }),
      ]);

      console.log('[VERIFY RETURN] Донат підтверджено:', orderReference);

      // Гейміфікація окремо — не ламаємо основний флоу
      if (donation.donorId) {
        try {
          await this.gamification.processAfterDonation(
            donation.donorId,
            donation.campaign.category,
            donation.amount,
            donation.campaignId,
          );
        } catch (e: any) {
          console.error('[VERIFY RETURN] Gamification error:', e?.message);
        }
      }

      try {
        const updatedCampaign = await this.prisma.campaign.findUnique({
          where: { id: donation.campaignId },
          select: { currentAmount: true, goalAmount: true },
        });
        if (
          updatedCampaign &&
          updatedCampaign.currentAmount >= updatedCampaign.goalAmount
        ) {
          await this.gamification.processAfterCampaignFunded(
            donation.campaignId,
          );
        }
      } catch (e: any) {
        console.error('[VERIFY RETURN] Campaign funded error:', e?.message);
      }

      return { success: true };
    }

    if (['Declined', 'Expired'].includes(transactionStatus)) {
      await this.prisma.donation.update({
        where: { orderReference },
        data: { status: 'declined' },
      });
      return { success: false, status: transactionStatus };
    }

    return { success: false, status: transactionStatus };
  }

  async handleWebhook(body: any) {
    const expectedSignature = this.generateSignature([
      String(body.merchantAccount),
      String(body.orderReference),
      String(body.amount),
      String(body.currency),
      String(body.authCode ?? ''),
      String(body.cardPan ?? ''),
      String(body.transactionStatus),
      String(body.reasonCode ?? ''),
    ]);

    if (expectedSignature !== body.merchantSignature) {
      return { status: 'error', message: 'Invalid signature' };
    }

    const donation = await this.prisma.donation.findUnique({
      where: { orderReference: body.orderReference },
      include: { campaign: { select: { category: true } } },
    });

    if (!donation) return { status: 'error', message: 'Donation not found' };
    if (donation.status === 'approved') {
      const responseTime = Math.floor(Date.now() / 1000);
      return {
        orderReference: body.orderReference,
        status: 'accept',
        time: responseTime,
        signature: this.generateSignature([
          body.orderReference,
          'accept',
          String(responseTime),
        ]),
      };
    }

    if (body.transactionStatus === 'Approved') {
      await this.prisma.$transaction([
        this.prisma.donation.update({
          where: { orderReference: body.orderReference },
          data: {
            status: 'approved',
            transactionId: String(body.transactionId),
          },
        }),
        this.prisma.campaign.update({
          where: { id: donation.campaignId },
          data: { currentAmount: { increment: donation.amount } },
        }),
      ]);

      if (donation.donorId) {
        await this.gamification.processAfterDonation(
          donation.donorId,
          donation.campaign.category,
          donation.amount,
          donation.campaignId,
        );
      }

      const updatedCampaign = await this.prisma.campaign.findUnique({
        where: { id: donation.campaignId },
        select: { currentAmount: true, goalAmount: true },
      });

      if (
        updatedCampaign &&
        updatedCampaign.currentAmount >= updatedCampaign.goalAmount
      ) {
        await this.gamification.processAfterCampaignFunded(donation.campaignId);
      }
    } else if (['Declined', 'Expired'].includes(body.transactionStatus)) {
      await this.prisma.donation.update({
        where: { orderReference: body.orderReference },
        data: { status: 'declined' },
      });
    }

    const responseTime = Math.floor(Date.now() / 1000);
    return {
      orderReference: body.orderReference,
      status: 'accept',
      time: responseTime,
      signature: this.generateSignature([
        body.orderReference,
        'accept',
        String(responseTime),
      ]),
    };
  }

  async findByUser(userId: string) {
    return this.prisma.donation.findMany({
      where: { donorId: userId, status: 'approved' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        campaign: {
          select: {
            id: true,
            title: true,
            category: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCampaign(campaignId: string) {
    return this.prisma.donation.findMany({
      where: { campaignId, status: 'approved' },
      select: {
        id: true,
        amount: true,
        donorName: true,
        createdAt: true,
        donor: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
