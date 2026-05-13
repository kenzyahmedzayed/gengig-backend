import { Controller, Post, Get,Put, Body, Query, HttpCode, HttpStatus, UseGuards, Res } from '@nestjs/common';
import { IsEmail, IsString } from "class-validator";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { UserDocument } from "../users/users.schema";
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';

class ResendDto {
  @IsEmail()
  email!: string;
}

class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;
}

class VerifyResetCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  code!: string;
}

class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  newPassword!: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
@Throttle({ short: { limit: 3, ttl: 60000 } })
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}

@Post('verify-email')
@HttpCode(HttpStatus.OK)
verifyEmail(@Body() dto: VerifyEmailDto) {
  return this.authService.verifyEmail(dto.email, dto.code);
}

@Post('resend-code')
@HttpCode(HttpStatus.OK)
resendVerification(@Body() dto: ResendDto) {
    return this.authService.resendVerification(dto.email);
}

@Get('me')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: UserDocument) {
  return this.authService.getProfile(String(user._id));
}

@Throttle({ short: { limit: 5, ttl: 60000 } })
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

@Throttle({ short: { limit: 3, ttl: 60000 } })
@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto);
}

@Post('verify-reset-code')
@HttpCode(HttpStatus.OK)
verifyResetCode(@Body() dto: VerifyResetCodeDto) {
  return this.authService.verifyResetCode(dto.email, dto.code);
}

@Post('reset-password')
@HttpCode(HttpStatus.OK)
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto.email, dto.newPassword);
}

@Put('change-password')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
changePassword(
  @CurrentUser() user: UserDocument,
  @Body() dto: ChangePasswordDto,
) {
  return this.authService.changePassword(
    String(user._id),
    dto.currentPassword,
    dto.newPassword,
  );
}

@Post('logout')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
async logout() {
  return this.authService.logout();
}

@Get('google')
@UseGuards(AuthGuard('google'))
googleLogin() {
}

@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(
  @CurrentUser() user: UserDocument,
  @Res() res: any,
) {
  const token = await this.authService.generateAccessTokenPublic(user);
  const frontendUrl = `http://localhost:5173/auth/google/success?token=${token}&role=${user.role}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;
  return res.redirect(frontendUrl);
}

@Post('google/supabase')
@HttpCode(HttpStatus.OK)
async googleSupabase(
  @Body() body: { email: string; name: string; photo: string; googleId?: string },
) {
  return this.authService.googleLogin(body.email, body.name, body.photo);
}
}