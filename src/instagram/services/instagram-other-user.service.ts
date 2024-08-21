import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from 'src/user/schemas/user.schema';
import { UserSocProfile } from 'src/user/schemas/user-soc-profile.schema';

import { IGGraphApiUrl } from '../consts/consts';
import { GetPostsDto } from '../dto/getPosts.dto';

@Injectable()
export class InstagramOtherUserService {
  private readonly logger = new Logger();
  //coment
  constructor(
    private readonly userService: UserService,
    private readonly httpService: HttpService,
    @InjectModel(UserSocProfile.name)
    private readonly userSocProfileModel: Model<UserSocProfile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getAnotherUserPosts(
    userId: string,
    getPostsDto: GetPostsDto,
    anotherUserName: string,
  ) {
    try {
      if (!anotherUserName) return;
      let { after, before } = getPostsDto;

      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      let url: string;

      if (after) {
        url = `${IGGraphApiUrl}/${businessId}/?fields=business_discovery.username(${anotherUserName}){media.after(${after}){comments_count,like_count,media_url,permalink,username,caption,timestamp,media_type,media_product_type}}`;
      } else if (before) {
        url = `${IGGraphApiUrl}/${businessId}/?fields=business_discovery.username(${anotherUserName}){media.before(${before}){comments_count,like_count,media_url,permalink,username,caption,timestamp,media_type,media_product_type}}`;
      } else {
        url = `${IGGraphApiUrl}/${businessId}/?fields=business_discovery.username(${anotherUserName}){media{comments_count,like_count,media_url,permalink,username,caption,timestamp,media_type,media_product_type}}`;
      }

      const response = (
        await this.httpService.axiosRef.get(url, {
          headers: {
            Authorization: `Bearer ${fbToken}`,
          },
        })
      ).data.business_discovery.media;

      return response;
    } catch (error) {
      this.logger.error(error);

      if (error.code === 'ERR_BAD_REQUEST') {
        throw new HttpException(
          error?.response?.data?.error?.error_user_msg,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Error while getting post types.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAnotherUserProfileData(userId: string, anotherUserName: string) {
    try {
      if (!anotherUserName) return;
      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      const profileDataUrl = `${IGGraphApiUrl}/${businessId}/?fields=business_discovery.username(${anotherUserName}){followers_count,follows_count,name,biography,username,profile_picture_url,id, media_count}`;

      const profileData = (
        await this.httpService.axiosRef.get(profileDataUrl, {
          headers: {
            Authorization: `Bearer ${fbToken}`,
          },
        })
      ).data.business_discovery;

      return profileData;
    } catch (error) {
      this.logger.error(error);
      if (error.code === 'ERR_BAD_REQUEST') {
        throw new HttpException(
          error?.response?.data?.error?.error_user_msg,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Error while getting post types.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
