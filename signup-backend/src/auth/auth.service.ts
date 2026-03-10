import { Injectable, ConflictException, BadRequestException, NotFoundException, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import type { UserDocument } from '../users/users.schema';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
  await this.usersService.create({
  name: dto.name,
  email: dto.email,
  password: hashedPassword,
  isEmailVerified: false,
  verificationCode: verificationCode,
  verificationCodeExpires: verificationExpires,
});

    //const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    

    this.mailService.sendVerificationEmail(dto.email, dto.name, verificationCode)
      .catch(() => {});

    return {
      message: 'Registration successful! Please check your email to verify your account.',
    };
  }

  async verifyEmail(email: string, code: string) {
  const user = await this.usersService.findByEmailWithVerification(email);

  if (!user) {
    throw new BadRequestException('Invalid email');
  }

  if (user.isEmailVerified) {
    throw new BadRequestException('Email already verified');
  }

  if (user.verificationCode !== code) {
    throw new BadRequestException('Invalid verification code');
  }

  if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
  throw new BadRequestException('Verification code expired');
}

  await this.usersService.updateById(String(user._id), {
    isEmailVerified: true,
    verificationCode: undefined,
    verificationCodeExpires: undefined,
  });

  const access_token = await this.generateAccessToken(user);
  return { access_token };
}

 async resendVerification(email: string) {
  const user = await this.usersService.findByEmail(email);

  if (!user) {
    return { message: 'If that email is registered, a code has been sent.' };
  }

  if (user.isEmailVerified) {
    throw new BadRequestException('Email already verified');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

  await this.usersService.updateById(String(user._id), {
    verificationCode,
    verificationCodeExpires: verificationExpires,
  });

  this.mailService
    .sendVerificationEmail(user.email, user.name, verificationCode)
    .catch(() => {});

  return { message: 'Verification code sent.' };
}

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async generateAccessToken(user: UserDocument): Promise<string> {
    return this.jwtService.signAsync(
      { sub: String(user._id), email: user.email },
      {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') || '15m',
      },
    );
  }

  async login(loginDto: LoginDto){
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) { 
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid){
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { email: user.email, sub: user._id };
    const token = await this.jwtService.signAsync(payload, {
  secret: 'mysecretkey123',
  expiresIn: '15m',
});

    return {
      message: 'Login Successful',
      access_token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email, newPassword } = forgotPasswordDto;

    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { message: 'Password updated successfully' };
  }
  async logout() {
  return { message: 'Logged out successfully' };
}

}