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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('chat')
@ApiBearerAuth('JWT')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiOperation({
    summary: 'Отримати або створити свій чат (тільки волонтери)',
  })
  @Get('me')
  getMyChat(@Request() req) {
    return this.chatService.getOrCreateChat(req.user.id);
  }

  @ApiOperation({ summary: 'Кількість непрочитаних повідомлень' })
  @Get('me/unread')
  getUnreadCount(@Request() req) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @ApiOperation({ summary: 'Відправити повідомлення' })
  @Post('me/message')
  async sendMessage(@Request() req, @Body() body: { text: string }) {
    const message = await this.chatService.sendMessage(
      req.user.id,
      body.text,
      false,
    );
    this.chatGateway.emitAdminNotification(
      req.user.id,
      message.chatId,
      message,
    );
    return message;
  }

  @ApiOperation({ summary: 'Позначити повідомлення як прочитані' })
  @Post('me/read')
  markAsRead(@Request() req) {
    return this.chatService.markAsRead(req.user.id);
  }

  @ApiOperation({ summary: '[Admin] Всі чати' })
  @Get('admin/all')
  getAllChats(@Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.getAllChats();
  }

  @ApiOperation({ summary: '[Admin] Ініціювати чат з волонтером' })
  @Post('admin/init/:userId')
  async initChatWithUser(@Param('userId') userId: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.getOrCreateChatAdmin(userId);
  }

  @ApiOperation({ summary: '[Admin] Отримати чат за ID' })
  @Get('admin/:chatId')
  getChatById(@Param('chatId') chatId: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.getChatById(chatId);
  }

  @ApiOperation({ summary: '[Admin] Відправити повідомлення волонтеру' })
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
    const userId = await this.chatService.getChatUserId(chatId);
    if (userId) this.chatGateway.emitToUser(userId, message);
    return message;
  }

  @ApiOperation({ summary: '[Admin] Позначити повідомлення як прочитані' })
  @Post('admin/:chatId/read')
  markAsReadAdmin(@Param('chatId') chatId: string, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Only admin');
    return this.chatService.markAsReadAdmin(chatId);
  }
}
