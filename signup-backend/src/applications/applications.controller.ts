import { Controller, Post, Get, Put, Param, Body, UseGuards, HttpCode, HttpStatus, } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('gigs/:id/apply')
  @HttpCode(HttpStatus.CREATED)
  apply(
    @Param('id') gigId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(String(user._id), gigId, dto);
  }

  @Get('agent/applications')
  findByAgent(@CurrentUser() user: UserDocument) {
    return this.applicationsService.findByAgent(String(user._id));
  }

  @Get('agent/applications/counts')
  getCounts(@CurrentUser() user: UserDocument) {
    return this.applicationsService.getCounts(String(user._id));
  }

  @Get('teenlancer/gigs')
  findByTeenlancer(@CurrentUser() user: UserDocument) {
    return this.applicationsService.findByTeenlancer(String(user._id));
  }

  @Put('applications/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.applicationsService.accept(id, String(user._id));
  }

  @Put('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.applicationsService.reject(id, String(user._id));
  }

  @Put('applications/:id/reset')
  @HttpCode(HttpStatus.OK)
  reset(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.applicationsService.reset(id, String(user._id));
  }

  @Get('teenlancer/dashboard')
  @UseGuards(JwtAuthGuard)
  getTeenlancerDashboard(@CurrentUser() user: UserDocument) {
  return this.applicationsService.getTeenlancerDashboard(String(user._id));
  }

  @Get('agent/dashboard')
  @UseGuards(JwtAuthGuard)
  getAgentDashboard(@CurrentUser() user: UserDocument) {
  return this.applicationsService.getAgentDashboard(String(user._id));
  }

  @Get('/teenlancer/applications')
  @UseGuards(JwtAuthGuard)
  getTeenlancerApplications(@CurrentUser() user: UserDocument) {
  return this.applicationsService.findByTeenlancer(String(user._id));
  }

  @Put('agent/applications/:id/accept')
  @HttpCode(HttpStatus.OK)
  acceptByAgent(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
) {
  return this.applicationsService.accept(id, String(user._id));
}

  @Put('agent/applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectByAgent(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
) {
  return this.applicationsService.reject(id, String(user._id));
}

  @Post('applications/:id/submit-work')
  @HttpCode(HttpStatus.OK)
  submitWork(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
  @Body() body: any,
) {
  return this.applicationsService.submitWork(id, String(user._id), body);
}

  @Get('applications/:id/submission')
  getSubmission(@Param('id') id: string) {
  return this.applicationsService.getSubmission(id);
  }

  @Post('applications/:id/approve-work')
  @HttpCode(HttpStatus.OK)
  approveWork(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
) {
  return this.applicationsService.approveWork(id, String(user._id));
}

  @Post('applications/:id/reject-work')
  @HttpCode(HttpStatus.OK)
  rejectWork(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
  @Body() body: { reason: string },
) {
  return this.applicationsService.rejectWork(id, String(user._id), body.reason);
}

  @Post('applications/:id/review')
  @HttpCode(HttpStatus.OK)
  reviewTeenlancer(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
  @Body() body: { stars: number; text: string },
) {
  return this.applicationsService.reviewTeenlancer(id, String(user._id), body);
}

  @Get('teenlancer/applications/:id')
  @UseGuards(JwtAuthGuard)
  getApplicationById(
  @Param('id') id: string,
) {
  return this.applicationsService.getSubmission(id);
}
}