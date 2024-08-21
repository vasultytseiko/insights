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
  Param,
} from '@nestjs/common';

import { Response, Request } from 'express';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { InstagramMeInsightsService } from '../services/instagram-me-insights.service';

import {
  ApiGetEngagementRate,
  ApiGetPostPublishDynamics,
  ApiGetPostTypes,
} from '../swagger/decorators';
import { AuthGuard } from 'src/auth/auth.guard';
import { ReqWithUser } from 'src/auth/interfaces/request-with-user';
import { GetEngagementRateDto } from '../dto/getEngagementRate.dto';
import { GetPostsDto } from '../dto/getPosts.dto';
import { SearchHashtagPostsDto } from '../dto/searchHashtagPosts.dto';

@ApiTags('instagram')
@Controller('instagram')
export class InstagramMeController {
  constructor(
    private readonly instagramMeInsightsService: InstagramMeInsightsService,
  ) {}

  @Get('/profile')
  getProfile(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.status(200).json({ message: request.cookies.accessToken });
  }

  @Get('/profile-info')
  async findPosts(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies.accessToken;

    if (!token) {
      throw new HttpException('Token not valid', HttpStatus.UNAUTHORIZED);
    }
    return await this.instagramMeInsightsService.getProfileInfo(token);
  }

  @Get('/followers-demographics')
  @ApiOperation({ summary: 'demographics', description: 'Description is here' })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['age', 'gender', 'country'],
    description: 'Type of request',
  })
  @ApiCookieAuth('access_token')
  async getFollowersDemographics(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
    @Query('type') queryType: string,
  ) {
    const token = request.cookies.accessToken;

    if (!token) {
      throw new HttpException('Token not valid', HttpStatus.UNAUTHORIZED);
    }
    const validTypes = ['age', 'gender', 'country'];
    if (!validTypes.includes(queryType))
      throw new HttpException(
        'Type must be in next value: age, gender, country ',
        HttpStatus.BAD_REQUEST,
      );

    const data = await this.instagramMeInsightsService.getFollowersDemographics(
      token,
      queryType,
    );

    response.status(200).json(data);
  }

  @Get('/reach')
  async getReach(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies.accessToken;

    if (!token) {
      throw new HttpException('Token not valid', HttpStatus.UNAUTHORIZED);
    }

    const { socNetToken, businessId } =
      await this.instagramMeInsightsService.getProfileData(token);
    const data = await this.instagramMeInsightsService.getReach(
      socNetToken,
      businessId,
    );
    response.status(200).json(data);
  }

  @Get('/likes')
  async getLikes(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies.accessToken;

    if (!token) {
      throw new HttpException('Token not valid', HttpStatus.UNAUTHORIZED);
    }

    const { socNetToken, businessId } =
      await this.instagramMeInsightsService.getProfileData(token);
    const data = await this.instagramMeInsightsService.getLikes(
      socNetToken,
      businessId,
    );
    response.status(200).json(data);
  }

  @Get('/followers')
  async getFollowers(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies.accessToken;

    if (!token) {
      throw new HttpException('Token not valid', HttpStatus.UNAUTHORIZED);
    }

    const { socNetToken, businessId, businessName } =
      await this.instagramMeInsightsService.getProfileData(token);
    const data = await this.instagramMeInsightsService.getFollowers(
      businessId,
      businessName,
      socNetToken,
    );
    response.status(200).json(data);
  }

  @ApiGetEngagementRate()
  @UseGuards(AuthGuard)
  @Get('engagement-rate')
  async engagementRate(
    @Req() req: ReqWithUser,
    @Query() getEngagementRateDto: GetEngagementRateDto,
  ) {
    return await this.instagramMeInsightsService.engagementRate(
      req.userId,
      getEngagementRateDto,
    );
  }

  @ApiGetPostPublishDynamics()
  @UseGuards(AuthGuard)
  @Get('post-dynamics')
  async getPostPublishDynamics(@Req() req: ReqWithUser) {
    return await this.instagramMeInsightsService.getPostPublishDynamics(
      req.userId,
    );
  }

  @ApiGetPostTypes()
  @UseGuards(AuthGuard)
  @Get('post-types')
  async getPostTypes(@Req() req: ReqWithUser) {
    return await this.instagramMeInsightsService.getPostypes(req.userId);
  }

  // @ApiGetPostTypes()
  @UseGuards(AuthGuard)
  @Get('posts')
  async getPosts(@Req() req: ReqWithUser, @Query() getPostsDto: GetPostsDto) {
    console.log('-=-=-=-=-=-=-get posts dto', getPostsDto);
    return await this.instagramMeInsightsService.getPosts(
      req.userId,
      getPostsDto,
    );
  }

  // @Post('/token')
  // async getLongLifeToken(@Req() request: any, @Res({ passthrough: true }) response: Response) {

  //   const token = request.cookies.accessToken;

  //   if (!token) {
  //     throw new HttpException("Token not valid", HttpStatus.UNAUTHORIZED)
  //   }
  //   const longLifeToken = await this.instagramMeInsightsService.getLongLifeToken(token);

  //   response.status(200).json({longLifeToken})

  // }

  @Post('/connect')
  async connectInstagramProfile(
    @Headers('authorization') authHeader: string,
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!authHeader) {
      response.status(400).json({
        status: 'bad request',
        code: 400,
        message: 'Token must be provided',
      });
      return;
    }

    const token = authHeader.split(' ');
    if (!token || token[0] !== 'Bearer') {
      throw new HttpException('Social token not valid', HttpStatus.BAD_REQUEST);
    }

    const accessToken = request.cookies.accessToken;
    if (!accessToken) {
      throw new HttpException('Access token not valid', HttpStatus.BAD_REQUEST);
    }

    await this.instagramMeInsightsService.profileAuth(token[1], accessToken);
    response.status(200).json({
      status: 'success',
      code: 200,
      message: 'Profile successfully auth',
    });
  }

  @UseGuards(AuthGuard)
  @Get('hashtag-search')
  async searchHashtag(
    @Req() req: ReqWithUser,
    @Query() searchHashtagPostsDto: SearchHashtagPostsDto,
  ) {
    return await this.instagramMeInsightsService.searchHashtag(
      req.userId,
      searchHashtagPostsDto,
    );
  }
}
