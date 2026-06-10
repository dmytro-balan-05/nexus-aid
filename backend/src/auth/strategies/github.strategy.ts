import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || 'placeholder',
      clientSecret:
        configService.get<string>('GITHUB_CLIENT_SECRET') || 'placeholder',
      callbackURL:
        configService.get<string>('GITHUB_CALLBACK_URL') ||
        'https://nexus-aid-production.up.railway.app/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const email =
      profile.emails?.[0]?.value || `${profile.username}@github.com`;
    const name = profile.displayName || profile.username;
    const avatar = profile.photos?.[0]?.value;

    return this.authService.validateOAuthUser({
      email,
      name,
      avatar,
      provider: 'github',
      socialId: String(profile.id),
    });
  }
}
