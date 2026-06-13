import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('me')
  getMyChat(@Request() req) {
    return this.chatService.getOrCreateChat(req.user.id);
  }

  @Get('me/unread')
  getUnreadCount(@Request() req) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @Post('me/message')
  sendMessage(@Request() req, @Body() body: { text: string }) {
    return this.chatService.sendMessage(req.user.id, body.text, false);
  }

  @Post('me/read')
  markAsRead(@Request() req) {
    return this.chatService.markAsRead(req.user.id);
  }

  @Get('admin/all')
  getAllChats(@Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.getAllChats();
  }

  @Get('admin/:chatId')
  getChatById(@Param('chatId') chatId: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.getChatById(chatId);
  }

  @Post('admin/:chatId/message')
  async sendAdminMessage(
    @Param('chatId') chatId: string,
    @Body() body: { text: string },
    @Request() req,
  ) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');

    const message = await this.chatService.sendMessageAdmin(
      chatId,
      req.user.id,
      body.text,
    );

    // Emit до волонтера в реальному часі
    const userId = await this.chatService.getChatUserId(chatId);
    if (userId) this.chatGateway.emitToUser(userId, message);

    return message;
  }

  @Post('admin/:chatId/read')
  markAsReadAdmin(@Param('chatId') chatId: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.markAsReadAdmin(chatId);
  }
}
