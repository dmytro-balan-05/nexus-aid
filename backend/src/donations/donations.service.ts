import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InitiateDonationDto } from './dto/initiate-donation.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DonationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
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

    await this.prisma.donation.create({
      data: {
        amount: dto.amount,
        orderReference,
        status: 'pending',
        campaignId: dto.campaignId,
        donorId: userId || null,
        donorName: dto.donorName || null,
        donorEmail: dto.donorEmail || null,
      },
    });

    // Порядок полів суворо за документацією WayForPay
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

  async handleWebhook(body: any) {
    const expectedSignature = this.generateSignature([
      body.merchantAccount,
      body.orderReference,
      body.amount,
      body.currency,
      body.authCode,
      body.cardPan,
      body.transactionStatus,
      body.reasonCode,
    ]);

    if (expectedSignature !== body.merchantSignature) {
      return { status: 'error', message: 'Invalid signature' };
    }

    const donation = await this.prisma.donation.findUnique({
      where: { orderReference: body.orderReference },
    });

    if (!donation) return { status: 'error', message: 'Donation not found' };

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
          data: {
            currentAmount: { increment: donation.amount },
          },
        }),
      ]);
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

  async findByCampaign(campaignId: string) {
    return this.prisma.donation.findMany({
      where: {
        campaignId,
        status: 'approved',
      },
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
