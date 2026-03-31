import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // GET /community/posts — public
  @Get('posts')
  findAll() {
    return this.communityService.findAll();
  }

  // GET /community/active-members — public
  @Get('active-members')
  getActiveMembers() {
    return this.communityService.getActiveMembers();
  }

  // GET /community/trending-tags — public
  @Get('trending-tags')
  getTrendingTags() {
    return this.communityService.getTrendingTags();
  }

  // POST /community/posts — teenlancers only
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreatePostDto,
  ) {
    return this.communityService.create(
      String(user._id),
      user.role,
      dto,
    );
  }

  // POST /community/posts/:id/like — teenlancers only
  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  likePost(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.communityService.likePost(id, String(user._id));
  }

  // POST /community/posts/:id/comments — teenlancers only
  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.addComment(
      id,
      String(user._id),
      user.role,
      dto,
    );
  }

  // GET /community/posts/:id/comments — public
  @Get('posts/:id/comments')
  getComments(@Param('id') id: string) {
    return this.communityService.getComments(id);
  }
}