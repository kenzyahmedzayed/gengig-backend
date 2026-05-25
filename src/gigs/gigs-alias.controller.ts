import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GigsService } from './gigs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller()
export class GigsAliasController {
  constructor(private readonly gigsService: GigsService) {}

@Get('agent/gigs')
@UseGuards(JwtAuthGuard)
  findAgentGigs(@CurrentUser() user: UserDocument) {
    return this.gigsService.findByAgent(String(user._id));
}

@Get('teenlancer/gigs-list')
@UseGuards(JwtAuthGuard)
  findTeenlancerGigsList(
    @CurrentUser() user: UserDocument,
    @Query('status') status: string,
  ) {
    return this.gigsService.findAll(status ? { status } : {});
}

@Get('teenlancer/saved-gigs')
@UseGuards(JwtAuthGuard)
  getSavedGigs(@CurrentUser() user: UserDocument) {
  return this.gigsService.getSavedGigs(String(user._id));
}
}
