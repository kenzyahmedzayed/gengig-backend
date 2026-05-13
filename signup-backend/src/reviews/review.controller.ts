import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus, } from '@nestjs/common';
import { ReviewsService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/users.schema';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

@Post('reviews')
@UseGuards(JwtAuthGuard)
@HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(String(user._id), user.role, dto);
}

@Get('teenlancer/reviews')
@UseGuards(JwtAuthGuard)
  getMyReviews(@CurrentUser() user: UserDocument) {
    return this.reviewsService.getTeenlancerReviews(String(user._id));
}

@Get('teenlancer/reviews/:id')
  getTeenlancerReviews(@Param('id') id: string) {
    return this.reviewsService.getTeenlancerReviews(id);
}

@Get('agent/reviews')
@UseGuards(JwtAuthGuard)
  getAgentReviews(@CurrentUser() user: UserDocument) {
    return this.reviewsService.getAgentReviews(String(user._id));
}

@Get('agent/stats')
@UseGuards(JwtAuthGuard)
  getAgentStats(@CurrentUser() user: UserDocument) {
    return this.reviewsService.getAgentStats(String(user._id));
}

@Get('teenlancer/rating/:id')
  getTeenlancerRating(@Param('id') id: string) {
    return this.reviewsService.getTeenlancerRating(id);
}

@Get('platform/stats')
getPlatformStats() {
  return this.reviewsService.getPlatformStats();
}

@Get('teenlancer/stats')
@UseGuards(JwtAuthGuard)
getTeenlancerStats(@CurrentUser() user: UserDocument) {
  return this.reviewsService.getTeenlancerStats(String(user._id));
}
}