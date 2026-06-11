import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
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
