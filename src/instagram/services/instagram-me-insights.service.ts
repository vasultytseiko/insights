import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  parse,
  startOfMonth,
  endOfMonth,
  format,
  addMonths,
  isBefore,
  subMonths,
} from 'date-fns';

import { User } from 'src/user/schemas/user.schema';
import { UserSocProfile } from 'src/user/schemas/user-soc-profile.schema';

import { IGGraphApiUrl } from '../consts/consts';
import { GetEngagementRateDto } from '../dto/getEngagementRate.dto';

import { IMonth } from '../interfaces/month';
import { IPostTypes } from '../interfaces/postTypes';
import { GetPostsDto } from '../dto/getPosts.dto';
import { SearchHashtagPostsDto } from '../dto/searchHashtagPosts.dto';

@Injectable()
export class InstagramMeInsightsService {
  private readonly jwtAccessSecret: string = process.env.JWT_ACCESS_SECRET;
  private readonly appId: string = process.env.APP_ID;
  private readonly appSecret: string = process.env.APP_SECRET;
  private readonly logger = new Logger();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    @InjectModel(UserSocProfile.name)
    private readonly userSocProfileModel: Model<UserSocProfile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getLongLifeToken(token: string) {
    try {
      const response = await this.httpService.axiosRef
        .get(`https://graph.facebook.com/v19.0/oauth/access_token?  
      grant_type=fb_exchange_token&          
      client_id=${this.appId}&
      client_secret=${this.appSecret}&
      fb_exchange_token=${token}`);
      if (!response)
        throw new HttpException(
          'Not response FB token',
          HttpStatus.BAD_REQUEST,
        );

      return response.data.access_token;
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async getProfileInfo(accessToken: string) {
    try {
      const { id } = this.jwtService.verify(accessToken, {
        secret: this.jwtAccessSecret,
      });

      const { socNetToken, businessId, businessName } =
        await this.getSocProfileByOwner(id, 'instagram');

      const mediaCountPromise = this.httpService.axiosRef.get(
        `${IGGraphApiUrl}/${businessId}/?fields=business_discovery.username(${businessName}){media_count}&access_token=${socNetToken}`,
      );

      const followers = this.getFollowers(
        businessId,
        businessName,
        socNetToken,
      );

      const profileViews = this.getProfileViews(socNetToken, businessId);

      const [mediaCountRes, followersRes, profileViewsRes] = await Promise.all([
        mediaCountPromise,
        followers,
        profileViews,
      ]);

      const mediaCount = mediaCountRes.data.business_discovery.media_count;

      const dataArray = [followersRes, profileViewsRes];

      return { dataArray, mediaCount };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error while getting profile info.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async getPosts(
  //   socNetToken: string,
  //   businessId: string,
  //   businessName: string,
  // ) {
  //   let allPosts = [];

  //   const postsResponse = await this.httpService.axiosRef.get(
  //     `https://graph.facebook.com/v19.0/${businessId}/?fields=business_discovery.username(${businessName}){followers_count,media_count, follows_count}&access_token=${socNetToken}`,
  //   );
  //   const { media_count } = postsResponse.data.business_discovery;
  //   console.log('-=-=-=-=--media count', media_count);

  //   let sixMonthsAgo = new Date();
  //   sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6, 1);
  //   let url = `https://graph.facebook.com/v19.0/${businessId}/media?fields=timestamp&access_token=${socNetToken}`;

  //   for (let i = 0; i < 50; i++) {
  //     const { data } = await this.httpService.axiosRef.get(url);
  //     allPosts.push(...data.data);

  //     const lastEl = allPosts[allPosts.length - 1];
  //     let date = new Date(lastEl?.timestamp);
  //     if (date.getTime() <= sixMonthsAgo.getTime()) {
  //       console.log('Дата є давнішою за 6 місяців від сьогодні.');
  //       break;
  //     }
  //     url = data.paging.next;
  //   }

  //   const startPosts = media_count - allPosts.length;
  //   console.log(startPosts, '<-=-=-Start');
  //   const dataPoints = [];

  //   let currentNum = 0;
  //   allPosts.forEach((el) => {
  //     const month = Number(el.timestamp.split('-')[1]);
  //     if (!dataPoints.length) {
  //       dataPoints.push({ x: 0, y: startPosts + 1 });
  //       return (currentNum = month);
  //     }
  //     if (month === currentNum) {
  //       dataPoints[dataPoints.length - 1].y += 1;
  //     }

  //     if (month !== currentNum) {
  //       dataPoints.push({
  //         x: dataPoints.length,
  //         y: dataPoints[dataPoints.length - 1].y + 1,
  //       });
  //       return (currentNum = month);
  //     }
  //   });

  //   const currentPoint = dataPoints[dataPoints.length - 1].y;
  //   const lastPoint = dataPoints[dataPoints.length - 2].y;
  //   const percentage =
  //     Math.ceil(((currentPoint - lastPoint) / lastPoint) * 1000) / 10;

  //   const posts = {
  //     title: 'Posts',
  //     count: media_count,
  //     down: currentPoint < lastPoint,
  //     color: currentPoint < lastPoint ? 'red' : 'blue',
  //     percentage,
  //     dataPoints,
  //   };
  //   return posts;
  // }

  async profileAuth(token: string, accessToken: string) {
    try {
      const socNetName = 'instagram';
      const { id } = this.jwtService.verify(accessToken, {
        secret: this.jwtAccessSecret,
      });

      const owner = await this.userService.findOne(id);
      if (!owner)
        throw new HttpException(
          'Profile owner not found',
          HttpStatus.UNAUTHORIZED,
        );

      const { businessId, businessName } = await this.getBusinessData(token);
      const instagramUserData = await this.httpService.axiosRef.get(
        `https://graph.facebook.com/me?fields=email,name&access_token=${token}`,
      );
      const socNetUserId = instagramUserData.data.id;
      const userProfile = await this.findProfile(socNetUserId);

      if (userProfile) {
        const longLifeToken = await this.getLongLifeToken(token);
        const updatedRecord = await this.updateProfileToken(
          userProfile._id.toString(),
          longLifeToken,
        );
        if (!updatedRecord)
          throw new HttpException(
            'The user has not been updated',
            HttpStatus.BAD_REQUEST,
          );

        return;
      }
      const longLifeToken = await this.getLongLifeToken(token);
      return await this.createSocProfile({
        socNetName,
        socNetToken: longLifeToken,
        socNetUserId,
        businessId,
        businessName,
        owner,
      });
    } catch (error) {
      throw new HttpException(error.response, HttpStatus.BAD_REQUEST);
    }
  }

  async getBusinessData(socNetToken: string) {
    try {
      const response = await this.httpService.axiosRef.get(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${socNetToken}`,
      );

      if (!response.data.data.length)
        throw new HttpException(
          'We were unable to authenticate your account. In order to authenticate, you need to link your Instagram account to a Facebook page.',
          HttpStatus.NOT_FOUND,
        );

      const businessPageId = response.data.data[0].id;
      const instagramBusiness = await this.httpService.axiosRef.get(
        `https://graph.facebook.com/v19.0/${businessPageId}?fields=instagram_business_account&access_token=${socNetToken}`,
      );

      if (!instagramBusiness.data.instagram_business_account) {
        throw new HttpException(
          'Your Facebook page exists, but your Instagram business/author page is not connected to it.',
          HttpStatus.NOT_FOUND,
        );
      }

      const businessId = instagramBusiness.data.instagram_business_account.id;
      const usernameRequest = await this.getUsername(businessId, socNetToken);
      const businessName = usernameRequest.data.username;

      return { businessId, businessName };
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND)
        throw new HttpException(error.response, HttpStatus.NOT_FOUND);
      throw new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    }
  }

  async getUsername(id: string, token: string) {
    return await this.httpService.axiosRef.get(
      `https://graph.facebook.com/v19.0/${id}?fields=username&access_token=${token}`,
    );
  }

  async findProfile(socNetUserId: string) {
    return await this.userSocProfileModel.findOne({
      socNetName: 'instagram',
      socNetUserId,
    });
  }

  async createSocProfile(data: UserSocProfile) {
    return await this.userSocProfileModel.create(data);
  }

  async getSocProfileByOwner(id: string, socNetName: string) {
    return await this.userSocProfileModel.findOne({ owner: id, socNetName });
  }

  // async updateUserSocData(id, data) {
  //   return await this.userSocProfileModel.findByIdAndUpdate(id, data, { new: true })
  // }

  async updateProfileToken(id: string, socNetToken: string) {
    return await this.userSocProfileModel.findByIdAndUpdate(
      id,
      { socNetToken },
      { new: true },
    );
  }

  async getFollowersDemographics(accessToken: string, type: string) {
    try {
      const { id } = this.jwtService.verify(accessToken, {
        secret: this.jwtAccessSecret,
      });
      const user = await this.userModel.findById(id);

      if (!user)
        throw new HttpException('User not found in DB', HttpStatus.NOT_FOUND);
      const { socNetToken, businessId, businessName } =
        await this.userSocProfileModel.findOne({ owner: id });
      if (!socNetToken || !businessId)
        throw new HttpException(
          'Profile not found in DB',
          HttpStatus.NOT_FOUND,
        );

      const followersResponse = await this.httpService.axiosRef.get(
        `https://graph.facebook.com/v19.0/${businessId}/?fields=business_discovery.username(${businessName}){followers_count}&access_token=${socNetToken}`,
      );
      const followers =
        followersResponse.data.business_discovery.followers_count;
      if (!followers)
        throw new HttpException('Followers not found', HttpStatus.NOT_FOUND);

      const labels = [];
      const data = [];

      switch (type) {
        case 'age':
          const ageResponse = await this.httpService.axiosRef.get(
            `https://graph.facebook.com/v19.0/${businessId}/insights?metric=follower_demographics&period= lifetime&metric_type=total_value&breakdown=age&access_token=${socNetToken}`,
          );
          const ages =
            ageResponse.data.data[0].total_value.breakdowns[0].results;
          if (!ages)
            throw new HttpException(
              'Followers age data not found',
              HttpStatus.NOT_FOUND,
            );
          ages.forEach((el) => {
            labels.push(el.dimension_values[0]),
              data.push(((el.value / followers) * 100).toFixed(1));
          });
          return { labels, data, followers };

        case 'gender':
          const genderResponse = await this.httpService.axiosRef.get(
            `https://graph.facebook.com/v19.0/${businessId}/insights?metric=follower_demographics&period= lifetime&metric_type=total_value&breakdown=gender&access_token=${socNetToken}`,
          );
          const genders =
            genderResponse.data.data[0].total_value.breakdowns[0].results;
          if (!genders)
            throw new HttpException(
              'Followers genders data not found',
              HttpStatus.NOT_FOUND,
            );
          genders.forEach((el) => {
            if (el.dimension_values[0] === 'F') {
              labels.push('Female');
            }
            if (el.dimension_values[0] === 'M') {
              labels.push('Male');
            }
            if (el.dimension_values[0] === 'U') {
              labels.push('Unknown');
            }
            data.push(parseFloat(((el.value / followers) * 100).toFixed(1)));
          });
          return { labels, data, followers };

        case 'country':
          const countriesResponse = await this.httpService.axiosRef.get(
            `https://graph.facebook.com/v19.0/${businessId}/insights?metric=follower_demographics&period= lifetime&metric_type=total_value&breakdown=country&access_token=${socNetToken}`,
          );
          const countries =
            countriesResponse.data.data[0].total_value.breakdowns[0].results;
          if (!countries)
            throw new HttpException(
              'Followers location data not found',
              HttpStatus.NOT_FOUND,
            );

          countries.sort((a, b) => b.value - a.value);
          countries.forEach((el) => {
            let regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
            if ((el.value / followers) * 100 < 0.5) {
              if (!labels.includes('Other countries')) {
                labels.push('Other countries');
                return data.push(
                  parseFloat(((el.value / followers) * 100).toFixed(1)),
                );
              }
              return (data[data.length - 1] += parseFloat(
                ((el.value / followers) * 100).toFixed(1),
              ));
            }
            labels.push(regionNames.of(el.dimension_values[0])),
              data.push(parseFloat(((el.value / followers) * 100).toFixed(1)));
          });
          return { labels, data, followers };

        default:
          break;
      }

      return;
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async getReach(token: string, id: string) {
    try {
      let month = Number(new Date().getMonth());
      let year = Number(new Date().getFullYear());
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const data = { labels: [], impressions: [], reach: [] };

      for (let i = 0; i < 6; i++) {
        if (month === 0) {
          year -= 1;
          month = 12;
        }
        const response = await this.httpService.axiosRef.get(
          `https://graph.facebook.com/v19.0/${id}/insights?metric=impressions,reach&period=days_28&since=${year}-${month}-27&until=${year}-${month}-28&access_token=${token}`,
        );
        if (!response)
          throw new HttpException('Request failed', HttpStatus.BAD_REQUEST);

        response.data.data.forEach((el) => {
          if (el.name === 'impressions') {
            const value = el.values[0].value;
            data.labels.unshift(months[month - 1]);
            data.impressions.unshift(value);
          }

          if (el.name === 'reach') {
            const value = el.values[0].value;
            data.reach.unshift(value);
          }
        });
        month -= 1;
      }
      return data;
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async getLikes(token: string, id: string) {
    try {
      let month = Number(new Date().getMonth());
      let year = Number(new Date().getFullYear());
      const data = { total: [], reel: [], post: [], video: [] };

      for (let i = 0; i < 6; i++) {
        if (month === 0) {
          year -= 1;
          month = 12;
        }
        let day = 31;
        if (month === 4 || month === 6 || month === 9 || month === 11) day = 30;
        if (month === 2) day = 28;
        console.log({ day, month, year });

        const response = await this.httpService.axiosRef.get(
          `https://graph.facebook.com/v19.0/${id}/insights?metric=likes&period=day&breakdown=media_product_type&metric_type=total_value&since=${year}-${month}-1&until=${year}-${month}-${day}&access_token=${token}`,
        );
        if (!response)
          throw new HttpException('Request failed', HttpStatus.BAD_REQUEST);

        data.total.push({
          value: response.data.data[0].total_value.value,
          month,
        });
        response.data.data[0].total_value.breakdowns[0].results.forEach(
          (el) => {
            if (el.dimension_values[0] === 'REEL') {
              const value = el.value;
              return data.reel.push({ value, month });
            }

            if (el.dimension_values[0] === 'POST') {
              const value = el.value;
              return data.post.push({ value, month });
            }
          },
        );
        console.log({ month, year });
        month -= 1;
      }
      return data;
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async getProfileViews(token: string, id: string) {
    try {
      let month = Number(new Date().getMonth());
      let year = Number(new Date().getFullYear());
      const data = [];

      for (let i = 0; i < 6; i++) {
        if (month === 0) {
          year -= 1;
          month = 12;
        }
        let day = 31;
        if (month === 4 || month === 6 || month === 9 || month === 11) day = 30;
        if (month === 2) day = 28;

        const viewsResponse = await this.httpService.axiosRef.get(
          `https://graph.facebook.com/v19.0/${id}/insights?metric=profile_views&period=day&since=${year}-${month}-1&until=${year}-${month}-${day}&access_token=${token}`,
        );
        if (!viewsResponse)
          throw new HttpException('Request failed', HttpStatus.BAD_REQUEST);

        const views = viewsResponse.data.data[0].values.reduce(
          (accumulator, currentValue) => accumulator + currentValue.value,
          0,
        );
        data.push({ views, month });
        month -= 1;
      }
      data.reverse();

      const dataPoints = data.map((el, index) => {
        return { x: index, y: el.views };
      });

      const lastMonth = data[data.length - 1].views;
      const penultimateMonth = data[data.length - 2].views;
      const totalViews = data.reduce(
        (accumulator, currentValue) => accumulator + currentValue.views,
        0,
      );
      console.log(lastMonth);
      const growth = lastMonth - penultimateMonth;
      const viewsPercentage = Math.round((growth / penultimateMonth) * 100);
      return {
        title: 'Profile views',
        count: lastMonth,
        percentage: viewsPercentage,
        down: growth < 0,
        color: growth > 0 ? 'blue' : 'red',
        dataPoints,
      };
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async getFollowers(businessId: string, businessName: string, token: string) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let month = Number(new Date().getMonth());
    let year = Number(new Date().getFullYear());
    const data = [];

    const followersCountResponse = await this.httpService.axiosRef.get(
      `https://graph.facebook.com/v19.0/${businessId}/?fields=business_discovery.username(${businessName}){followers_count}&access_token=${token}`,
    );
    const totalFollowers =
      followersCountResponse.data.business_discovery.followers_count;

    let currentIndex = 5;
    let currentFollowersCount = totalFollowers;

    for (let i = 0; i < 6; i++) {
      if (month === 0) {
        year -= 1;
        month = 12;
      }
      let day = 31;
      if (month === 4 || month === 6 || month === 9 || month === 11) day = 30;
      if (month === 2) day = 28;

      const followersResponse = await this.httpService.axiosRef.get(
        `https://graph.facebook.com/v19.0/${businessId}/insights?metric=follows_and_unfollows&metric_type=total_value&period=day&breakdown=follow_type&since=${year}-${month}-1&until=${year}-${month}-${day}&access_token=${token}`,
      );
      if (!followersResponse)
        throw new HttpException('Request failed', HttpStatus.BAD_REQUEST);

      const subscribes =
        followersResponse.data.data[0].total_value.breakdowns[0].results[0]
          .value;
      const unsubscribes =
        followersResponse.data.data[0].total_value.breakdowns[0].results[1]
          .value;

      data.push({ x: currentIndex, y: currentFollowersCount });

      currentIndex -= 1;
      currentFollowersCount = currentFollowersCount - subscribes + unsubscribes;
      month -= 1;
    }

    data.reverse();

    const lastMonth = data[data.length - 1].y;
    const penultimateMonth = data[data.length - 2].y;

    const percentage =
      ((lastMonth - penultimateMonth) / penultimateMonth) * 1000;
    const roundedPercentage = Math.ceil(percentage) / 10;

    return {
      title: 'Followers',
      count: totalFollowers,
      percentage: roundedPercentage,
      down: lastMonth < penultimateMonth,
      color: lastMonth < penultimateMonth ? 'red' : 'blue',
      dataPoints: data,
    };
  }

  private createMonthes2(getEngagementRateDto: GetEngagementRateDto) {
    const { sinceMonth, untilMonth } = getEngagementRateDto;

    const sinceDate = parse(sinceMonth, 'yyyy-MM', new Date());
    const untilDate = parse(untilMonth, 'yyyy-MM', new Date());

    const months: IMonth[] = [];

    let currentDate = sinceDate;

    while (
      isBefore(currentDate, untilDate) ||
      format(currentDate, 'yyyy-MM') === untilMonth
    ) {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      months.push({
        sinceDate: format(start, 'yyyy-MM-dd'),
        untilDate: format(end, 'yyyy-MM-dd'),
      });

      currentDate = addMonths(currentDate, 1);
    }

    return months;
  }

  /**
   * engagement rate - The percentage ratio of total interactions to impressions
   * (number of impressions that led to an interaction) in period of month
   * @returns
   */
  async engagementRate(
    userId: string,
    getEngagementRateDto: GetEngagementRateDto,
  ): Promise<
    {
      engagementRate: string;
      month: string;
    }[]
  > {
    try {
      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      const months = this.createMonthes(
        getEngagementRateDto.sinceMonth,
        getEngagementRateDto.untilMonth,
        'end-of-curr-month',
      );

      const promises = months.map((month) => {
        return this.httpService.axiosRef.get(
          `${IGGraphApiUrl}/${businessId}/insights?metric=total_interactions,impressions&period=day&metric_type=total_value&since=${month.sinceDate}&until=${month.untilDate}&access_token=${fbToken}`,
        );
      });

      const responses = await Promise.all(promises);

      const result = responses.map((resp, index) => {
        const totalInteractions = resp.data.data[0].total_value.value;
        const impressions = resp.data.data[1].total_value.value;
        const engagementRate =
          ((totalInteractions / impressions) * 100).toFixed(2) + '%';
        return {
          engagementRate,
          month: months[index].sinceDate.split('-').slice(0, 2).join('-'),
        };
      });

      return result;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error while getting engagement rate.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Dynamics publishing of posts, returns percentage of increase / decrease posts publishing in current month compared to previous
   * @param userId
   * @returns
   */
  async getPostPublishDynamics(userId: string) {
    try {
      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      const sixMonthsRange = this.helperGetSixMonthsDates();

      for (const key in sixMonthsRange) {
        sixMonthsRange[key] = sixMonthsRange[key]
          .split('-')
          .slice(0, 2)
          .join('-');
      }

      const months = this.createMonthes(
        sixMonthsRange.since,
        sixMonthsRange.until,
        'start-of-next-month',
      );

      const promises = months.map((month) => {
        const url = `${IGGraphApiUrl}/${businessId}/media?fields=id,timestamp&since=${month.sinceDate}&until=${month.untilDate}&access_token=${fbToken}`;
        const monthNumber = month.sinceDate.split('-').slice(0, 2).join('-');
        return this.helperGetPostsLengthPaginated(url, monthNumber);
      });

      const responses = await Promise.all(promises);

      const lastDiff = this.helperCalculatePercentageChange(
        responses[responses.length - 1].media_count,
        responses[responses.length - 2].media_count,
      );

      return { numberMediaPerMonth: responses, lastDiff };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error while getting dynamics publishing of posts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Getting post types - getting count of types of posts (video, reel, image, carousel_album) for 6 months
   * @param userId
   * @returns
   */
  async getPostypes(userId: string): Promise<IPostTypes> {
    try {
      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      const sixMonths = this.helperGetSixMonthsDates();

      let url = `${IGGraphApiUrl}/${businessId}/media?fields=media_type,timestamp&since=${sixMonths.since}&until=${sixMonths.until}&access_token=${fbToken}`;

      let storiesUrl = `${IGGraphApiUrl}/${businessId}/stories?fields=media_type,timestamp&access_token=${fbToken}`;

      let response: AxiosResponse<any, any>;

      const countPostTypes: IPostTypes = {
        total: 0,
        image: { name: 'IMAGE', count: 0, percent: '' },
        carouselAlbum: { name: 'CAROUSEL_ALBUM', count: 0, percent: '' },
        reel: { name: 'REELS', count: 0, percent: '' },
        video: { name: 'VIDEO', count: 0, percent: '' },
        stories: { name: 'STORIES', count: 0, percent: '' },
      };

      while (url) {
        response = await this.httpService.axiosRef.get(url);
        response.data.data.map((item) => {
          countPostTypes.total++;
          if (item.media_type === countPostTypes.image.name) {
            countPostTypes.image.count++;
          } else if (item.media_type === countPostTypes.carouselAlbum.name) {
            countPostTypes.carouselAlbum.count++;
          } else if (item.media_type === countPostTypes.reel.name) {
            countPostTypes.reel.count++;
          } else if (item.media_type === countPostTypes.video.name) {
            countPostTypes.video.count++;
          }
        });

        url =
          response.data.paging && response.data.paging.next
            ? response.data.paging.next
            : null;
      }

      while (storiesUrl) {
        response = await this.httpService.axiosRef.get(storiesUrl);
        countPostTypes.total += response.data.data.length;
        countPostTypes.stories.count += response.data.data.length;

        storiesUrl =
          response.data.paging && response.data.paging.next
            ? response.data.paging.next
            : null;
      }

      for (const key in countPostTypes) {
        if (key !== 'total') {
          // console.log('-=-=-=-=-=-=-', countPostTypes[key]);
          const keyCount = countPostTypes[key].count;
          countPostTypes[key].percent =
            String(((keyCount / countPostTypes.total) * 100).toFixed(2)) + '%';
        }
      }

      return countPostTypes;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error while getting post types.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPosts(userId: string, getPostsDto: GetPostsDto) {
    try {
      let { after, before } = getPostsDto;

      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      const profileImgUrl = `${IGGraphApiUrl}/${businessId}/?fields=profile_picture_url`;
      let url: string;

      if (after) {
        url = `${IGGraphApiUrl}/${businessId}/media?limit=25&fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count&after=${after}`;
      } else if (before) {
        url = `${IGGraphApiUrl}/${businessId}/media?limit=25&fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count&before=${before}`;
      } else {
        url = `${IGGraphApiUrl}/${businessId}/media?limit=25&fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count`;
      }

      const profileImg = (
        await this.httpService.axiosRef.get(profileImgUrl, {
          headers: {
            Authorization: `Bearer ${fbToken}`,
          },
        })
      ).data.profile_picture_url;

      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          Authorization: `Bearer ${fbToken}`,
        },
      });

      return { profileImg, ...response.data };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error while getting post types.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // private async helperGetPa

  /**
   * helper for getPostPublishDynamics, calculate percentage of increase / decrease posts in current month compared previous
   */
  private helperCalculatePercentageChange(current: number, previous: number) {
    if (previous === 0 && current) {
      return 'New activity'; // Якщо в попередньому місяці не було постів, то приріст 100%
    } else if (!previous && !current) {
      return { change: 0, changePercentage: 0 + '%' };
    }

    const change = current - previous;
    const changePercentage =
      String(((current - previous) / previous) * 100) + '%';
    return { change, changePercentage };
  }

  /**
   * helper for getPostPublishDynamics get number of posts
   */
  private async helperGetPostsLengthPaginated(
    url: string,
    monthNumber: string,
  ) {
    let length = 0;
    while (url) {
      const response = await this.httpService.axiosRef.get(url);

      length += response.data.data.length;

      // Check for next page
      url =
        response.data.paging && response.data.paging.next
          ? response.data.paging.next
          : null;
    }

    return { media_count: length, monthNumber };
  }

  /**
   * Helper for "getPostTypes"
   * @returns dates 5 months ago to current (including) in formate 'yyyy-MM-dd'
   */
  private helperGetSixMonthsDates() {
    const now = new Date();

    const untilDate = format(endOfMonth(now), 'yyyy-MM-dd');

    const threeMonthsAgo = subMonths(now, 5);
    const sinceThreeMonthsAgo = format(
      startOfMonth(threeMonthsAgo),
      'yyyy-MM-dd',
    );

    return { since: sinceThreeMonthsAgo, until: untilDate };
  }

  /**
   * helper for getPostPublishDynamics, gets dates for req
   */
  private helperGetMonths() {
    const now = new Date();
    const since1 = format(startOfMonth(now), 'yyyy-MM-dd');
    const until1 = format(endOfMonth(now), 'yyyy-MM-dd');

    const currMonth: IMonth = {
      sinceDate: since1,
      untilDate: until1,
    };

    const lastMonth = subMonths(now, 1);
    const since2 = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
    const until2 = format(endOfMonth(lastMonth), 'yyyy-MM-dd');

    const prevMonth: IMonth = {
      sinceDate: since2,
      untilDate: until2,
    };

    return { currMonth, prevMonth };
  }

  /**
   * helper for GetEngagementRate
   */
  private createMonthes(sinceMonth: string, untilMonth: string, type: string) {
    const sinceDate = parse(sinceMonth, 'yyyy-MM', new Date());
    const untilDate = parse(untilMonth, 'yyyy-MM', new Date());

    const months: IMonth[] = [];

    let currentDate = sinceDate;

    while (
      isBefore(currentDate, untilDate) ||
      format(currentDate, 'yyyy-MM') === untilMonth
    ) {
      const start = startOfMonth(currentDate);
      let end: Date;
      if (type === 'end-of-curr-month') {
        end = endOfMonth(currentDate);
      } else if (type === 'start-of-next-month') {
        end = startOfMonth(addMonths(currentDate, 1));
      }

      months.push({
        sinceDate: format(start, 'yyyy-MM-dd'),
        untilDate: format(end, 'yyyy-MM-dd'),
      });

      currentDate = addMonths(currentDate, 1);
    }

    return months;
  }

  async getProfileData(token) {
    try {
      const { id } = this.jwtService.verify(token, {
        secret: this.jwtAccessSecret,
      });
      const user = await this.userModel.findById(id);

      if (!user)
        throw new HttpException('User not found in DB', HttpStatus.NOT_FOUND);
      const { socNetToken, businessId, businessName } =
        await this.userSocProfileModel.findOne({ owner: id });
      if (!socNetToken || !businessId)
        throw new HttpException(
          'Profile not found in DB',
          HttpStatus.NOT_FOUND,
        );

      return { socNetToken, businessId, businessName };
    } catch (error) {
      throw new HttpException(error.response, error.status);
    }
  }

  async searchHashtag(
    userId: string,
    searchHashtagPostsDto: SearchHashtagPostsDto,
  ) {
    try {
      console.log('-=-=-=-=-=-=-hashtag dto', searchHashtagPostsDto);

      // if (!hashtag) return;
      const { socNetToken: fbToken, businessId } =
        await this.userSocProfileModel
          .findOne({ owner: userId })
          .select('socNetToken')
          .select('businessId')
          .exec();

      let hashtagResponse: AxiosResponse<any, any>;
      let hashtagId: string;
      let hashTagPostsUrl: string;

      if (searchHashtagPostsDto.hashtag) {
        const hashTagurl = `${IGGraphApiUrl}/ig_hashtag_search?user_id=${businessId}&q=${searchHashtagPostsDto.hashtag}`;
        hashtagResponse = (
          await this.httpService.axiosRef.get(hashTagurl, {
            headers: {
              Authorization: `Bearer ${fbToken}`,
            },
          })
        ).data;
        hashtagId = hashtagResponse.data[0].id;
        hashTagPostsUrl = `${IGGraphApiUrl}/${hashtagId}/top_media?user_id=${businessId}&fields=id,caption,media_type,comments_count,like_count,media_url,permalink,timestamp&limit=25`;
      }

      if (searchHashtagPostsDto.after && searchHashtagPostsDto.hashtagId) {
        hashTagPostsUrl = `${IGGraphApiUrl}/${searchHashtagPostsDto.hashtagId}/top_media?user_id=${businessId}&fields=id,caption,media_type,comments_count,like_count,media_url,permalink,timestamp&limit=25&after=${searchHashtagPostsDto.after}`;
      } else if (
        searchHashtagPostsDto.before &&
        searchHashtagPostsDto.hashtagId
      ) {
        hashTagPostsUrl = `${IGGraphApiUrl}/${searchHashtagPostsDto.hashtagId}/top_media?user_id=${businessId}&fields=id,caption,media_type,comments_count,like_count,media_url,permalink,timestamp&limit=25&before=${searchHashtagPostsDto.before}`;
      }

      const hashtagPosts = (
        await this.httpService.axiosRef.get(hashTagPostsUrl, {
          headers: {
            Authorization: `Bearer ${fbToken}`,
          },
        })
      ).data;

      console.log('-=-=-=-=-=-=-=-hashtag', hashtagId);

      return {
        hashtagId: hashtagId || searchHashtagPostsDto.hashtagId,
        ...hashtagPosts,
      };
    } catch (error) {
      this.logger.error(error);
      console.log('-=-=-=-=-=-errr', error?.response?.data);
      if (error.code === 'ERR_BAD_REQUEST') {
        throw new HttpException(
          error?.response?.data?.error?.error_user_msg,
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        'Error while searching by hashtag.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
