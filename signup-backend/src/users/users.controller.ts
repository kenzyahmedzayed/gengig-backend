import { Controller, Post, Put, Get, Delete, Body, UseGuards, HttpCode, HttpStatus,} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { TeenlancerOnboardingDto } from './dto/teenlancer-onboarding.dto';
import { AgentOnboardingDto } from './dto/agent-onboarding.dto';
import type { UserDocument } from './users.schema';

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
}