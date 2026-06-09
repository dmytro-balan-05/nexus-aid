import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

const storageConfig = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Недопустимий тип файлу'), false);
  }
};

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor('documents', 5, {
      storage: storageConfig,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    const documentPaths = files
      ? files.map((f) => `/uploads/${f.filename}`)
      : [];

    const createCampaignDto: CreateCampaignDto = {
      title: body.title,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription,
      goalAmount: Number(body.goalAmount),
      location: body.location,
      beneficiary: body.beneficiary,
      category: body.category,
      images: body.image ? [body.image] : [],
      documents: documentPaths,
      isUrgent: body.isUrgent === 'true' || body.isUrgent === true,
      urgentUntil: body.urgentUntil ? String(body.urgentUntil) : undefined,
    };

    const authorId = req.user.userId || req.user.id || req.user.sub;
    return this.campaignsService.create(createCampaignDto, authorId);
  }

  @Get('random')
  getRandom(@Query('category') category?: string) {
    return this.campaignsService.getRandomByCategory(category);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteCampaign(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin')
      throw new ForbiddenException('Only admin can delete campaigns');
    return this.campaignsService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('documents', 5, {
      storage: storageConfig,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    const documentPaths = files
      ? files.map((f) => `/uploads/${f.filename}`)
      : [];
    const updateCampaignDto = {
      ...body,
      images: body.image ? [body.image] : undefined,
      documents: documentPaths.length > 0 ? documentPaths : undefined,
    };
    return this.campaignsService.update(id, updateCampaignDto, req.user.id);
  }

  @Get('urgent')
  getUrgent() {
    return this.campaignsService.getUrgentByCategory();
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('sort') sort?: 'asc' | 'desc',
    @Query('category') category?: string,
  ) {
    return this.campaignsService.findAll(search, sort, category);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }
}
