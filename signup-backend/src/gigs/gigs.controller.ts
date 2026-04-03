import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,} from '@nestjs/common';
import { GigsService } from './gigs.service';
import { CreateGigDto } from './dto/create-gig.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller('gigs')
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  // GET /gigs
  @Get()
  findAll(@Query() query: any) {
    return this.gigsService.findAll(query);
  }

  // GET /gigs/featured
  @Get('featured')
  findFeatured() {
    return this.gigsService.findFeatured();
  }

  // GET /gigs/search?q=website
  @Get('search')
  search(@Query() query: any) {
    return this.gigsService.findAll({ search: query.q, ...query });
  }

  // GET /gigs/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gigsService.findById(id);
  }

  // POST /gigs
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateGigDto,
  ) {
    return this.gigsService.create(String(user._id), dto);
  }

  // PUT /gigs/:id
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: Partial<CreateGigDto>,
  ) {
    return this.gigsService.update(id, String(user._id), dto);
  }

  // DELETE /gigs/:id
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
  // GET /agent/gigs
@Get('/agent/gigs')
@UseGuards(JwtAuthGuard)
findAgentGigs(@CurrentUser() user: UserDocument) {
  return this.gigsService.findByAgent(String(user._id));
}

// GET /teenlancer/gigs?status=completed
@Get('/teenlancer/gigs')
@UseGuards(JwtAuthGuard)
findTeenlancerGigs(
  @CurrentUser() user: UserDocument,
  @Query('status') status: string,
) {
  return this.gigsService.findByAgent(String(user._id));
}
// GET /gigs/recommended
@Get('recommended')
@UseGuards(JwtAuthGuard)
getRecommended(@CurrentUser() user: UserDocument) {
  return this.gigsService.getRecommended(String(user._id));
}

// GET /gigs/related/:id
@Get('related/:id')
getRelated(@Param('id') id: string) {
  return this.gigsService.getRelated(id);
}

// GET /gigs/category/:category
@Get('category/:category')
getByCategory(@Param('category') category: string) {
  return this.gigsService.findAll({ category });
}

// POST /gigs/:id/save
@Post(':id/save')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
saveGig(
  @Param('id') id: string,
  @CurrentUser() user: UserDocument,
) {
  return this.gigsService.saveGig(id, String(user._id));
}
}