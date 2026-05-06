import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,} from '@nestjs/common';
import { GigsService } from './gigs.service';
import { CreateGigDto } from './dto/create-gig.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller('gigs')
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  private normalizeGigDto(body: any): CreateGigDto {
    const normalizeArray = (value: any) => {
      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      return undefined;
    };

    return {
      title: body.title ?? body.gigTitle ?? '',
      description: body.description ?? body.details ?? body.summary ?? '',
      category: body.category ?? body.serviceCategory ?? '',
      budget: String(body.budget ?? body.price ?? body.rate ?? ''),
      duration: body.duration ?? body.timeline ?? undefined,
      deadline: body.deadline ?? body.dueDate ?? undefined,
      skills: normalizeArray(body.skills),
      requirements: normalizeArray(body.requirements),
    };
  }


  @Get()
  findAll(@Query() query: any) {
    return this.gigsService.findAll(query);
  }

  @Get('featured')
  findFeatured() {
    return this.gigsService.findFeatured();
  }

  @Get('search')
  search(@Query() query: any) {
    return this.gigsService.findAll({ search: query.q, ...query });
  }

  @Get('/agent/gigs')
@UseGuards(JwtAuthGuard)
findAgentGigs(
  @CurrentUser() user: UserDocument,
  @Query('status') status: string,
) {
  return this.gigsService.findByAgent(String(user._id), status);
}

  @Get('teenlancer/gigs')
  @UseGuards(JwtAuthGuard)
  findTeenlancerGigs(
    @CurrentUser() user: UserDocument,
    @Query('status') status: string,
  ) {
    return this.gigsService.findByAgent(String(user._id));
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  getRecommended(@CurrentUser() user: UserDocument) {
    return this.gigsService.getRecommended(String(user._id));
  }

  @Get('related/:id')
  getRelated(@Param('id') id: string) {
    return this.gigsService.getRelated(id);
  }

  @Get('category/:category')
  getByCategory(@Param('category') category: string) {
    return this.gigsService.findAll({ category });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gigsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() body: any,
  ) {
    return this.gigsService.create(
      String(user._id),
      this.normalizeGigDto(body),
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() body: any,
  ) {
    return this.gigsService.update(
      id,
      String(user._id),
      this.normalizeGigDto(body),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    await this.gigsService.delete(id, String(user._id));
    return { message: 'Gig deleted successfully' };
  }

@Post(':id/save')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
saveGig(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
) {
  return this.gigsService.saveGig(id, String(user._id));
}
@Put(':id/complete')
@UseGuards(JwtAuthGuard)
async completeGig(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
) {
  return this.gigsService.completeGig(id, String(user._id));
}
}
