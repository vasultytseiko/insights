import {
  Controller,
  Get,
  Post,
  Headers,
  HttpException,
  HttpStatus,
  Res,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Response, Request } from 'express';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from 'src/auth/auth.guard';
import { ReqWithUser } from 'src/auth/interfaces/request-with-user';
import { GetEngagementRateDto } from '../dto/getEngagementRate.dto';
import { InstagramOtherUserService } from '../services/instagram-other-user.service';

import {
  ApiGetEngagementRate,
  ApiGetPostPublishDynamics,
  ApiGetPostTypes,
} from '../swagger/decorators';
import { GetPostsDto } from '../dto/getPosts.dto';

@ApiTags('instagram-other-user')
@Controller('instagram-other-user')
export class InstagramOtherUserController {
  constructor(
    private readonly instagramOtherUserService: InstagramOtherUserService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('posts')
  async getAnotherUserPosts(
    @Req() req: ReqWithUser,
    @Query() getPostsDto: GetPostsDto,
    @Query('username') anotherUserName: string,
  ) {
    return await this.instagramOtherUserService.getAnotherUserPosts(
      req.userId,
      getPostsDto,
      anotherUserName,
    );
  }

  @UseGuards(AuthGuard)
  @Get('profile-info')
  async getAnotherUserProfileData(
    @Req() req: ReqWithUser,
    @Query('username') anotherUserName: string,
  ) {
    return await this.instagramOtherUserService.getAnotherUserProfileData(
      req.userId,
      anotherUserName,
    );
  }
}
