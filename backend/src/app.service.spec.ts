import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth/auth.service';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GamificationService } from './gamification/gamification.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockGamification = {
    grantBadgeSystem: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: GamificationService, useValue: mockGamification },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
        name: 'Test',
      });

      const result = await service.validateUser('test@test.com', 'password123');
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('test@test.com');
    });

    it('should return null when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: hashedPassword,
      });

      const result = await service.validateUser('test@test.com', 'wrongpass');
      expect(result).toBeNull();
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('noone@test.com', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token', async () => {
      const user = {
        id: '1',
        email: 'test@test.com',
        role: 'user',
        name: 'Test',
      };
      const result = await service.login(user);
      expect(result.access_token).toBe('mock-token');
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        email: 'exists@test.com',
      });
      await expect(
        service.register({
          email: 'exists@test.com',
          password: 'pass123',
          name: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and return access_token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '2',
        email: 'new@test.com',
        role: 'user',
        name: 'New',
      });

      const result = await service.register({
        email: 'new@test.com',
        password: 'pass123',
        name: 'NewUser',
      });

      expect(result.access_token).toBe('mock-token');
      expect(mockGamification.grantBadgeSystem).toHaveBeenCalled();
    });
  });

  describe('validateOAuthUser', () => {
    it('should return existing OAuth user', async () => {
      const existingUser = {
        id: '1',
        email: 'oauth@test.com',
        provider: 'google',
        socialId: '123',
      };
      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      const result = await service.validateOAuthUser({
        email: 'oauth@test.com',
        name: 'OAuth User',
        provider: 'google',
        socialId: '123',
      });

      expect(result).toEqual(existingUser);
    });

    it('should create new user for first OAuth login', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const newUser = {
        id: '3',
        email: 'new@google.com',
        provider: 'google',
        socialId: '456',
      };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const result = await service.validateOAuthUser({
        email: 'new@google.com',
        name: 'Google User',
        provider: 'google',
        socialId: '456',
      });

      expect(result).toEqual(newUser);
      expect(mockGamification.grantBadgeSystem).toHaveBeenCalled();
    });
  });
});
