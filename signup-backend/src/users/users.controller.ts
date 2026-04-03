import { Controller, Post, Put, Get, Delete, Body, UseGuards, HttpCode, HttpStatus, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { TeenlancerOnboardingDto } from './dto/teenlancer-onboarding.dto';
import { AgentOnboardingDto } from './dto/agent-onboarding.dto';
import type { UserDocument } from './users.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudinary } from './cloudinary.config';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/profile
  @Get('profile')
  getProfile(@CurrentUser() user: UserDocument) {
    return this.usersService.findById(String(user._id));
  }

  // POST /users/onboarding/teenlancer
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

  // POST /users/onboarding/agent
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

  // PUT /users/profile
  @Put('profile')
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() dto: Partial<TeenlancerOnboardingDto & AgentOnboardingDto>,
  ) {
    return this.usersService.updateById(String(user._id), dto);
  }

  // DELETE /users/account
  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: UserDocument) {
    await this.usersService.deleteById(String(user._id));
    return { message: 'Account deleted successfully' };
  }
  // PUT /users/settings
@Put('settings')
@HttpCode(HttpStatus.OK)
updateSettings(
  @CurrentUser() user: UserDocument,
  @Body() dto: any,
) {
  return this.usersService.updateById(String(user._id), {
    name: dto.name,
    email: dto.email,
  });
}
// GET /users/settings
@Get('settings')
getSettings(@CurrentUser() user: UserDocument) {
  return this.usersService.findById(String(user._id));
}

// PUT /users/notifications
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
  // POST /users/upload-photo
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

  // Upload to Cloudinary
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'gengig/profiles',
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    ).end(file.buffer);
  });

  const photoUrl = (result as any).secure_url;

  // Save photo URL to user profile
  await this.usersService.updateById(String(user._id), {
    photo: photoUrl,
  });

  return {
    message: 'Photo uploaded successfully',
    photoUrl,
  };
}
// GET /teenlancer/stats
@Get('teenlancer/stats')
@UseGuards(JwtAuthGuard)
getTeenlancerStats(@CurrentUser() user: UserDocument) {
  return this.usersService.getTeenlancerStats(String(user._id));
}

// GET /teenlancer/activity
@Get('teenlancer/activity')
@UseGuards(JwtAuthGuard)
getTeenlancerActivity(@CurrentUser() user: UserDocument) {
  return this.usersService.getTeenlancerActivity(String(user._id));
}
// GET /teenlancer/dashboard
@Get('teenlancer/dashboard')
@UseGuards(JwtAuthGuard)
getTeenlancerDashboard(@CurrentUser() user: UserDocument) {
  return this.usersService.getTeenlancerDashboard(String(user._id));
}

// GET /agent/dashboard
@Get('agent/dashboard')
@UseGuards(JwtAuthGuard)
getAgentDashboard(@CurrentUser() user: UserDocument) {
  return this.usersService.getAgentDashboard(String(user._id));
}
// GET /platform/stats
@Get('platform/stats')
getPlatformStats() {
  return this.usersService.getPlatformStats();
}
// GET /users/teenlancers
@Get('teenlancers')
getTeenlancers(@Query() query: any) {
  return this.usersService.getTeenlancers(query);
}
// POST /uploads/image
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
}