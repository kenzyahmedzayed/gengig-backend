import { Controller, Post, Put, Get, Delete, Body, UseGuards, HttpCode, HttpStatus, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { TeenlancerOnboardingDto } from './dto/teenlancer-onboarding.dto';
import { AgentOnboardingDto } from './dto/agent-onboarding.dto';
import type { UserDocument } from './users.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudinary } from './cloudinary.config';
import { memoryStorage } from 'multer';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private normalizeUserUpdate(dto: any) {
    return {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
      ...(dto.photo !== undefined ? { photo: dto.photo } : {}),
      ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      ...(dto.education !== undefined ? { education: dto.education } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.skills !== undefined ? { skills: dto.skills } : {}),
      ...(dto.availability !== undefined ? { availability: dto.availability } : {}),
      ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
      ...(dto.hourlyRate !== undefined ? { rate: dto.hourlyRate } : {}),
      ...(dto.company !== undefined ? { company: dto.company } : {}),
      ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
      ...(dto.workTypes !== undefined ? { workTypes: dto.workTypes } : {}),
      ...(dto.portfolio !== undefined ? { portfolio: dto.portfolio } : {}),
      ...(dto.notificationPreferences !== undefined
        ? { notificationPreferences: dto.notificationPreferences }
        : {}),
    };
}

@Get('profile')
  getProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.findById(String(user._id));
}

@Post('onboarding/teenlancer')
@HttpCode(HttpStatus.OK)
  teenlancerOnboarding(
    @CurrentUser() user: UserDocument,
    @Body() dto: TeenlancerOnboardingDto,
  ) {
    return this.usersService.updateById(String(user._id), {
      ...dto,
      isOnboardingComplete: true,
    });
}

@Post('onboarding/agent')
@HttpCode(HttpStatus.OK)
  agentOnboarding(
    @CurrentUser() user: UserDocument,
    @Body() dto: AgentOnboardingDto,
  ) {
    return this.usersService.updateById(String(user._id), {
      ...dto,
      isOnboardingComplete: true,
    });
}

@Put('profile')
@HttpCode(HttpStatus.OK)
updateProfile(
  @CurrentUser() user: UserDocument,
  @Body() dto: any,
) {
  const normalized = this.normalizeUserUpdate(dto);
  
  if (normalized.photo && !normalized.photo.startsWith('http')) {
    delete normalized.photo;
  }
  
  return this.usersService.updateById(String(user._id), normalized);
}

@Delete('account')
@HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: UserDocument) {
    await this.usersService.deleteById(String(user._id));
    return { message: 'Account deleted successfully' };
}

@Put('settings')
@HttpCode(HttpStatus.OK)
updateSettings(
  @CurrentUser() user: UserDocument,
  @Body() dto: any,
) {
  return this.usersService.updateById(
    String(user._id),
    this.normalizeUserUpdate(dto),
  );
}

@Get('settings')
getSettings(@CurrentUser() user: UserDocument) {
  return this.usersService.findById(String(user._id));
}

@Put('notifications')
@HttpCode(HttpStatus.OK)
updateNotifications(
  @CurrentUser() user: UserDocument,
  @Body() dto: any,
) {
  return this.usersService.updateById(String(user._id), {
    notificationPreferences: dto,
  });
}

@Post('upload-photo')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('photo'))
async uploadPhoto(
  @CurrentUser() user: UserDocument,
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'gengig/profiles',
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    ).end(file.buffer);
  });

  const photoUrl = (result as any).secure_url;

  await this.usersService.updateById(String(user._id), {
    photo: photoUrl,
  });

 return {
  message: 'Photo uploaded successfully',
  photoUrl,
  url: photoUrl,
};
}

@Get('teenlancer/stats')
@UseGuards(JwtAuthGuard)
getTeenlancerStats(@CurrentUser() user: UserDocument) {
  return this.usersService.getTeenlancerStats(String(user._id));
}

@Get('teenlancer/activity')
@UseGuards(JwtAuthGuard)
getTeenlancerActivity(@CurrentUser() user: UserDocument) {
  return this.usersService.getTeenlancerActivity(String(user._id));
}

@Get('teenlancer/dashboard')
@UseGuards(JwtAuthGuard)
getTeenlancerDashboard(@CurrentUser() user: UserDocument) {
  return this.usersService.getTeenlancerDashboard(String(user._id));
}

@Get('agent/dashboard')
@UseGuards(JwtAuthGuard)
getAgentDashboard(@CurrentUser() user: UserDocument) {
  return this.usersService.getAgentDashboard(String(user._id));
}

@Get('platform/stats')
getPlatformStats() {
  return this.usersService.getPlatformStats();
}

@Get('teenlancers')
getTeenlancers(@Query() query: any) {
  return this.usersService.getTeenlancers(query);
}

@Post('/uploads/image')
@UseInterceptors(FileInterceptor('image'))
async uploadImage(
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'gengig/community',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    ).end(file.buffer);
  });

  return {
    url: (result as any).secure_url,
  };
}

@Get('agent/stats')
@UseGuards(JwtAuthGuard)
getAgentStats(@CurrentUser() user: UserDocument) {
  return this.usersService.getAgentStats(String(user._id));
}

@Get('premium-status')
@UseGuards(JwtAuthGuard)
async getPremiumStatus(@CurrentUser() user: UserDocument) {
  const fullUser = await this.usersService.findById(String(user._id));
  return {
    isPremium: fullUser?.isPremium || false,
    premiumUntil: fullUser?.premiumUntil || null,
    plan: fullUser?.premiumPlan || null,
  };
}
}