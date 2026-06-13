import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GamificationService } from './gamification/gamification.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NexusAid API')
    .setDescription(
      'REST API для благодійної платформи NexusAid з гейміфікацією.\n\n' +
        '**Авторизація:** POST /auth/login → скопіюй `access_token` → натисни Authorize → вставь токен.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('app', 'Загальні ендпоінти')
    .addTag('auth', 'Автентифікація')
    .addTag('users', 'Управління користувачами')
    .addTag('campaigns', 'Благодійні збори')
    .addTag('donations', 'Донати та платежі')
    .addTag('gamification', 'Гейміфікація та бейджі')
    .addTag('verification', 'Верифікація волонтерів')
    .addTag('chat', 'Чат підтримки')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  try {
    const gamification = app.get(GamificationService);
    await gamification.seedBadges();
  } catch (e) {
    console.error('seedBadges failed:', e);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`API docs: http://localhost:${process.env.PORT ?? 3000}/docs`);
}
bootstrap();
