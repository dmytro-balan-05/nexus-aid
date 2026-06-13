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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DonationsService } from './donations.service';
import { InitiateDonationDto } from './dto/initiate-donation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Ініціювати донат (авторизований користувач)' })
  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  initiate(@Body() dto: InitiateDonationDto, @Request() req) {
    return this.donationsService.initiate(dto, req.user.id);
  }

  @ApiOperation({ summary: 'Ініціювати анонімний донат' })
  @Post('initiate/anonymous')
  initiateAnonymous(@Body() dto: InitiateDonationDto) {
    return this.donationsService.initiate(dto);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @Post('webhook')
  webhook(@Body() body: any) {
    return this.donationsService.handleWebhook(body);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @Post('verify-return')
  verifyReturn(@Body() body: Record<string, string>) {
    return this.donationsService.verifyReturn(body);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @Post('handle-return')
  async handleReturnPost(
    @Body() body: any,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      'https://nexus-aid-frontend-production.up.railway.app';
    const params = { ...(query || {}), ...(body || {}) };
    console.log('[HANDLE RETURN POST] params:', JSON.stringify(params));
    try {
      const result = await this.donationsService.verifyReturn(params);
      const success = result.success || result.alreadyProcessed;
      return res.redirect(
        `${frontendUrl}/donations/result?success=${success}&status=${params.transactionStatus || ''}`,
      );
    } catch (e: any) {
      console.error('[HANDLE RETURN ERROR]', e?.message);
      return res.redirect(
        `${frontendUrl}/donations/result?success=false&status=error`,
      );
    }
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @Get('handle-return')
  async handleReturnGet(@Query() query: any, @Res() res: Response) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      'https://nexus-aid-frontend-production.up.railway.app';
    const params = { ...(query || {}) };
    console.log('[HANDLE RETURN GET] params:', JSON.stringify(params));
    try {
      const result = await this.donationsService.verifyReturn(params);
      const success = result.success || result.alreadyProcessed;
      return res.redirect(
        `${frontendUrl}/donations/result?success=${success}&status=${params.transactionStatus || ''}`,
      );
    } catch (e: any) {
      console.error('[HANDLE RETURN ERROR]', e?.message);
      return res.redirect(
        `${frontendUrl}/donations/result?success=false&status=error`,
      );
    }
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Мої донати' })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyDonations(@Request() req) {
    return this.donationsService.findByUser(req.user.id);
  }

  @ApiOperation({ summary: 'Донати до конкретної кампанії' })
  @Get('campaign/:id')
  findByCampaign(@Param('id') id: string) {
    return this.donationsService.findByCampaign(id);
  }
}
