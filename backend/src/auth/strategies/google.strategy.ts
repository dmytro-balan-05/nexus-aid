import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const clientID =
      configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder';
    const clientSecret =
      configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder';
    console.log('[GOOGLE] CLIENT_ID:', clientID);
    console.log(
      '[GOOGLE] CLIENT_SECRET starts with:',
      clientSecret?.substring(0, 10),
    );

    super({
      clientID,
      clientSecret,
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'https://nexus-aid-production.up.railway.app/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const avatar = profile.photos?.[0]?.value;

    return this.authService.validateOAuthUser({
      email,
      name,
      avatar,
      provider: 'google',
      socialId: String(profile.id),
    });
  }
}
