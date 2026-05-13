import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        MailModule,
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const expiresIn =
                  configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '7d';

                return {
                    secret:
                      configService.get<string>('JWT_ACCESS_SECRET') || 'mysecretkey123',
                    signOptions: {
                      expiresIn: expiresIn as any,
                    },
                };
            },
        }),
    ],
controllers: [AuthController],
providers: [AuthService, JwtStrategy, GoogleStrategy],
})

export class AuthModule{}
