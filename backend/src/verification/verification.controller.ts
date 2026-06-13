import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';
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

@ApiTags('verification')
@ApiBearerAuth('JWT')
@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @ApiOperation({ summary: 'Подати заявку на верифікацію волонтера' })
  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(
    FilesInterceptor('documents', 5, {
      storage: storageConfig,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async submit(
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    if (!body.about || !body.experience)
      throw new BadRequestException('Заповніть всі обовʼязкові поля');
    const documents = files ? files.map((f) => `/uploads/${f.filename}`) : [];
    return this.verificationService.submitRequest(req.user.id, {
      about: body.about,
      experience: body.experience,
      socialLinks: body.socialLinks || undefined,
      documents,
    });
  }

  @ApiOperation({ summary: 'Моя заявка на верифікацію' })
  @Get('me')
  getMyRequest(@Request() req) {
    return this.verificationService.getMyRequest(req.user.id);
  }

  @ApiOperation({ summary: '[Admin] Всі заявки' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
  })
  @Get()
  getAllRequests(@Request() req, @Query('status') status?: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.verificationService.getAllRequests(status);
  }

  @ApiOperation({ summary: '[Admin] Деталі заявки' })
  @Get(':id')
  getById(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.verificationService.getRequestById(id);
  }

  @ApiOperation({ summary: 'Написати повідомлення до заявки' })
  @Post(':id/message')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { text: string },
    @Request() req,
  ) {
    return this.verificationService.sendMessage(
      id,
      req.user.id,
      body.text,
      req.user.role === 'admin',
    );
  }

  @ApiOperation({ summary: '[Admin] Схвалити або відхилити заявку' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' },
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.verificationService.updateStatus(id, body.status, req.user.id);
  }
}
