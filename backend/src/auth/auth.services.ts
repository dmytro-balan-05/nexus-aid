import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Методы допишем позже, главное чтобы класс существовал
  async validateUser(email: string, pass: string): Promise<any> {
    return null;
  }
  async login(user: any) {
    return null;
  }
  async register(dto: any) {
    return null;
  }
}
