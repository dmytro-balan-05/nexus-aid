import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: 'Health check',
    description: 'Перевірка стану сервісу та підключення до БД',
  })
  @ApiResponse({ status: 200, description: 'Сервіс працює' })
  @Get('health')
  async health() {
    return this.appService.healthCheck();
  }

  @ApiOperation({ summary: 'Статистика платформи' })
  @ApiResponse({ status: 200, description: 'Загальна статистика' })
  @Get('stats')
  getStats() {
    return this.appService.getStats();
  }
}
