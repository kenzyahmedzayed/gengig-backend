import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus, } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  private normalizeCreatePostDto(body: any): CreatePostDto {
    return {
      content: body.content ?? body.text ?? body.postContent ?? '',
      image: body.image ?? body.imageUrl ?? body.photo ?? undefined,
      tags: body.tags,
    };
  }

@Get('posts')
  findAll() {
    return this.communityService.findAll();
}

@Get('active-members')
  getActiveMembers() {
    return this.communityService.getActiveMembers();
}

@Get('trending-tags')
  getTrendingTags() {
    return this.communityService.getTrendingTags();
}

@Post('posts')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() body: any,
  ) {
    return this.communityService.create(
      String(user._id),
      user.role,
      this.normalizeCreatePostDto(body),
    );
}

@Post('posts/:id/like')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.OK)
  likePost(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.communityService.likePost(id, String(user._id));  
}

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

@Get('posts/:id/comments')
  getComments(@Param('id') id: string) {
    return this.communityService.getComments(id);
}
  
@Get('posts/:id')
getPost(@Param('id') id: string) {
  return this.communityService.findOne(id);
}
}
