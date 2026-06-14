# NexusAid — Благодійна платформа

[![GitLab Pipeline](https://git.ztu.edu.ua/vt221_bdo/graduation_project/badges/main/pipeline.svg)](https://git.ztu.edu.ua/vt221_bdo/graduation_project/-/pipelines)
[![GitLab Coverage](https://git.ztu.edu.ua/vt221_bdo/graduation_project/badges/main/coverage.svg)](https://git.ztu.edu.ua/vt221_bdo/graduation_project/-/jobs)
[![GitHub CI](https://github.com/dmytro-balan-05/nexus-aid/actions/workflows/ci.yml/badge.svg)](https://github.com/dmytro-balan-05/nexus-aid/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=dmytro-balan-05_nexus-aid&metric=alert_status)](https://sonarcloud.io/project/overview?id=dmytro-balan-05_nexus-aid)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=dmytro-balan-05_nexus-aid&metric=coverage)](https://sonarcloud.io/project/overview?id=dmytro-balan-05_nexus-aid)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=dmytro-balan-05_nexus-aid&metric=security_rating)](https://sonarcloud.io/project/overview?id=dmytro-balan-05_nexus-aid)
[![Mirror](https://github.com/dmytro-balan-05/nexus-aid/actions/workflows/mirror.yml/badge.svg)](https://github.com/dmytro-balan-05/nexus-aid/actions/workflows/mirror.yml)

## Живий застосунок

| | |
|---|---|
| 🌐 Застосунок | https://nexus-aid-frontend-production.up.railway.app |
| 📖 Swagger API | https://nexus-aid-production.up.railway.app/docs |
| 📊 SonarCloud | https://sonarcloud.io/project/overview?id=dmytro-balan-05_nexus-aid |
| 🦊 GitLab (університет) | https://git.ztu.edu.ua/vt221_bdo/graduation_project |
| 🐙 GitHub (дзеркало) | https://github.com/dmytro-balan-05/nexus-aid |

---

## Опис проекту

**NexusAid** — веб-платформа для збору благодійних коштів із системою гейміфікації. Донори отримують бейджі досягнень, підвищують рівень (Bronze → Silver → Gold → Platinum) та змагаються у таблиці лідерів. Волонтери створюють збори після верифікації адміністратором, платежі обробляються через WayForPay.

> 🎓 Дипломний проєкт бакалавра  
> **Студент:** Балан Дмитро Олегович, ВТ-22-1  
> **Науковий керівник:** Вакалюк Тетяна Анатоліївна, д.пед.н., професор  
> **Спеціальність:** 121 Інженерія програмного забезпечення  
> **Державний університет "Житомирська політехніка", 2026**

---

## Технологічний стек

| Шар | Технології |
|---|---|
| **Backend** | NestJS · TypeScript · Prisma ORM · PostgreSQL · Socket.io |
| **Frontend** | Next.js 16 · Tailwind CSS v4 · socket.io-client |
| **Автентифікація** | JWT (httpOnly cookie) · Google OAuth2 · Passport.js |
| **Платежі** | WayForPay (HMAC-MD5 підпис) |
| **DevOps** | Docker · docker-compose · Railway |
| **CI/CD** | GitHub Actions · GitLab CI (git.ztu.edu.ua) |
| **Якість коду** | SonarCloud · Jest (24 юніт-тести) · Swagger/OpenAPI |
| **Безпека** | Helmet · @nestjs/throttler (rate limiting) |

---

## Швидкий старт

```bash
# 1. Клонування
git clone https://git.ztu.edu.ua/vt221_bdo/graduation_project.git
cd graduation_project

# 2. Backend
cd backend
cp .env.example .env        # заповнити змінні (див. нижче)
npm install
npx prisma migrate dev
npm run start:dev           # → http://localhost:3000
                            # → Swagger: http://localhost:3000/docs

# 3. Frontend (окремий термінал)
cd frontend
npm install
npm run dev                 # → http://localhost:3001

# 4. Тести
cd backend && npm test
cd backend && npm run test:cov   # з coverage звітом
```

### Docker (альтернатива)

```bash
cp .env.example .env
docker-compose up --build

# Frontend:  http://localhost:3001
# Backend:   http://localhost:3000
# Swagger:   http://localhost:3000/docs
```

### Змінні середовища (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nexusaid
JWT_SECRET=your_secret_key

# Google OAuth2
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# WayForPay
WFP_MERCHANT_ACCOUNT=your_merchant_account
WFP_SECRET_KEY=your_secret_key
WFP_MERCHANT_DOMAIN=your_domain
WFP_RETURN_URL=https://your-domain/donations/result
WFP_SERVICE_URL=https://your-domain/donations/webhook

FRONTEND_URL=http://localhost:3001
```

> **Примітка:** Google OAuth та WayForPay потребують продакшн URL. Локально ці функції не працюють.  
> **Email-верифікація:** Railway блокує SMTP (порт 587). Реєстрація без підтвердження email — для production рекомендується Resend або SendGrid.

---

## CI/CD Pipeline

```
push → main
  ├── [1] Tests + Coverage → SonarCloud Scan
  ├── [2] Docker Build (multi-stage)
  ├── [3] Verify Deploy (health check Railway)
  └── [4] Mirror → git.ztu.edu.ua
```

| Етап | Дія |
|---|---|
| **install** | `npm ci` · встановлення залежностей |
| **test** | `npx prisma generate` · 24 юніт-тести · coverage звіт |
| **build** | `nest build` · Docker multi-stage image |
| **sonar** | Статичний аналіз SonarCloud · Quality Gate |
| **deploy** | Автодеплой Railway · health check `/stats` |
| **mirror** | GitHub → git.ztu.edu.ua синхронізація |

---

## Структура проекту

```
nexus-aid/
├── backend/                  ← NestJS API
│   ├── src/
│   │   ├── auth/             ← JWT, Google OAuth, стратегії
│   │   ├── campaigns/        ← Благодійні збори
│   │   ├── chat/             ← WebSocket чат (Gateway)
│   │   ├── donations/        ← Платежі WayForPay
│   │   ├── gamification/     ← Бейджі, рівні, лідерборд
│   │   ├── users/            ← Профілі, ролі
│   │   └── verification/     ← Верифікація волонтерів
│   ├── prisma/               ← Схема БД + міграції
│   ├── test/                 ← Юніт-тести (Jest)
│   └── Dockerfile            ← Multi-stage build
├── frontend/                 ← Next.js 16
│   ├── src/
│   │   ├── app/              ← Сторінки (App Router)
│   │   ├── components/       ← UI компоненти + WebSocket
│   │   └── context/          ← NotificationContext
│   └── Dockerfile
├── .github/workflows/        ← GitHub Actions (CI + mirror)
├── .gitlab-ci.yml            ← GitLab CI (університет)
├── docker-compose.yml        ← Локальний запуск
├── sonar-project.properties  ← SonarCloud конфігурація
└── .env.example              ← Шаблон змінних середовища
```

---

## Ролі та доступ

| Роль | Можливості |
|---|---|
| **user** | Перегляд зборів · донати · профіль · гейміфікація |
| **volonteer** | + Створення зборів · чат з адміністратором |
| **admin** | + Управління користувачами · верифікація · всі чати |
