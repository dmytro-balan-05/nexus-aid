import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { DonationsService } from './donations.service';
import { InitiateDonationDto } from './dto/initiate-donation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  initiate(@Body() dto: InitiateDonationDto, @Request() req) {
    return this.donationsService.initiate(dto, req.user.id);
  }

  @Post('initiate/anonymous')
  initiateAnonymous(@Body() dto: InitiateDonationDto) {
    return this.donationsService.initiate(dto);
  }

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.donationsService.handleWebhook(body);
  }

  @Post('verify-return')
  verifyReturn(@Body() body: Record<string, string>) {
    return this.donationsService.verifyReturn(body);
  }

  @Post('handle-return')
  async handleReturnPost(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      'https://nexus-aid-frontend-production.up.railway.app';
    try {
      const result = await this.donationsService.verifyReturn(body);
      const success = result.success || result.alreadyProcessed;
      return res.redirect(
        `${frontendUrl}/donations/result?success=${success}&status=${body.transactionStatus || ''}`,
      );
    } catch (e: any) {
      console.error('[HANDLE RETURN ERROR]', e?.message);
      return res.redirect(
        `${frontendUrl}/donations/result?success=false&status=error`,
      );
    }
  }

  @Get('handle-return')
  async handleReturnGet(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      'https://nexus-aid-frontend-production.up.railway.app';
    try {
      const result = await this.donationsService.verifyReturn(query);
      const success = result.success || result.alreadyProcessed;
      return res.redirect(
        `${frontendUrl}/donations/result?success=${success}&status=${query.transactionStatus || ''}`,
      );
    } catch (e: any) {
      console.error('[HANDLE RETURN ERROR]', e?.message);
      return res.redirect(
        `${frontendUrl}/donations/result?success=false&status=error`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyDonations(@Request() req) {
    return this.donationsService.findByUser(req.user.id);
  }

  @Get('campaign/:id')
  findByCampaign(@Param('id') id: string) {
    return this.donationsService.findByCampaign(id);
  }
}
