import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // POST /gigs/:id/apply
  @Post('gigs/:id/apply')
  @HttpCode(HttpStatus.CREATED)
  apply(
    @Param('id') gigId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(String(user._id), gigId, dto);
  }

  // GET /agent/applications
  @Get('agent/applications')
  findByAgent(@CurrentUser() user: UserDocument) {
    return this.applicationsService.findByAgent(String(user._id));
  }

  // GET /agent/applications/counts
  @Get('agent/applications/counts')
  getCounts(@CurrentUser() user: UserDocument) {
    return this.applicationsService.getCounts(String(user._id));
  }

  // GET /teenlancer/gigs
  @Get('teenlancer/gigs')
  findByTeenlancer(@CurrentUser() user: UserDocument) {
    return this.applicationsService.findByTeenlancer(String(user._id));
  }

  // PUT /applications/:id/accept
  @Put('applications/:id/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.applicationsService.accept(id, String(user._id));
  }

  // PUT /applications/:id/reject
  @Put('applications/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.applicationsService.reject(id, String(user._id));
  }

  // PUT /applications/:id/reset
  @Put('applications/:id/reset')
  @HttpCode(HttpStatus.OK)
  reset(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.applicationsService.reset(id, String(user._id));
  }
}