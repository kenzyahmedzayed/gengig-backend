import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from "class-validator";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { UserDocument } from "../users/users.schema";
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forget-password.dto';

class ResendDto {
  @IsEmail()
  email: string;
}

class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}

class VerifyResetCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}

class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
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

  @Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() loginDto: LoginDto){
  return this.authService.login(loginDto);
}

  @Post('forgot-password')
@HttpCode(HttpStatus.OK)
async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  return this.authService.forgotPassword(forgotPasswordDto);
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
@Post('logout')
@HttpCode(HttpStatus.OK)
@UseGuards(JwtAuthGuard)
async logout() {
  return this.authService.logout();
}
}