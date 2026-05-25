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
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') || 'disabled';
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') || 'disabled';
    const callbackURL =
      config.get<string>('GOOGLE_CALLBACK_URL') ||
      'http://localhost:3000/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
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

    let user = await this.usersService.findByEmail(email);

    if (!user) {
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
