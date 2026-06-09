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

@Controller('verification')
@UseGuards(JwtAuthGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

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
    if (!body.about || !body.experience) {
      throw new BadRequestException('Заповніть всі обовʼязкові поля');
    }

    const documents = files ? files.map((f) => `/uploads/${f.filename}`) : [];

    return this.verificationService.submitRequest(req.user.id, {
      about: body.about,
      experience: body.experience,
      socialLinks: body.socialLinks || undefined,
      documents,
    });
  }

  @Get('me')
  getMyRequest(@Request() req) {
    return this.verificationService.getMyRequest(req.user.id);
  }

  @Get()
  getAllRequests(@Request() req, @Query('status') status?: string) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.verificationService.getAllRequests(status);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.verificationService.getRequestById(id);
  }

  @Post(':id/message')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { text: string },
    @Request() req,
  ) {
    const isAdmin = req.user.role === 'admin';
    return this.verificationService.sendMessage(
      id,
      req.user.id,
      body.text,
      isAdmin,
    );
  }

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
