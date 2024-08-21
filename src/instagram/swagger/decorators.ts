import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import {
  engagementRateResponseExample,
  getPostPublishDynamicsExample,
  getPostTypesExample,
} from './examples';

export function ApiGetEngagementRate() {
  return applyDecorators(
    ApiCookieAuth(),
    ApiOperation({
      summary: 'Gets EngagementRate.',
      description:
        'EngagementRate - the percentage ratio of total interactions to impressions (number of impressions that led to an interaction) in period of month.',
    }),
    ApiOkResponse({
      status: HttpStatus.OK,
      schema: {
        example: engagementRateResponseExample,
      },
    }),
  );
}

export function ApiGetPostPublishDynamics() {
  return applyDecorators(
    ApiCookieAuth(),
    ApiOperation({
      summary: 'Dynamics publishing of posts.',
      description:
        'Dynamics publishing of posts, returns percentage of increase / decrease posts publishing in current month compared to previous.',
    }),
    ApiOkResponse({
      status: HttpStatus.OK,
      schema: {
        example: getPostPublishDynamicsExample,
      },
    }),
  );
}

export function ApiGetPostTypes() {
  return applyDecorators(
    ApiCookieAuth(),
    ApiOperation({
      summary: 'Post types.',
      description:
        'Post types, returns percentage of post types that published for last 6 months (including current), divided by images, videos, reels, stories (only for last 24 h.).',
    }),
    ApiOkResponse({
      status: HttpStatus.OK,
      schema: {
        example: getPostTypesExample,
      },
    }),
  );
}
