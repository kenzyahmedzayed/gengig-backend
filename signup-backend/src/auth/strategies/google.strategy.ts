import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/users.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || '1065255643053-8mj1rIv0qu6qgb9kbh7g608q8dtvu8hf.apps.googleusercontent.com',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || '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',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const email = emails[0].value;
    const photo = photos[0]?.value || '';
    const fullName = `${name.givenName} ${name.familyName}`;

    // Find or create user
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user with Google data
      user = await this.usersService.create({
        name: fullName,
        email,
        password: Math.random().toString(36).slice(-8),
        photo,
        isEmailVerified: true,
        role: UserRole.TEENLANCER,
      });
    }

    done(null, user);
  }
}