import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';

import { InstagramMeInsightsService } from './services/instagram-me-insights.service';
import { InstagramMeController } from './controllers/instagram-me.controller';
import { UserModule } from 'src/user/user.module';

import {
  UserSocProfile,
  UserSocProfileSchema,
} from 'src/user/schemas/user-soc-profile.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { InstagramOtherUserService } from './services/instagram-other-user.service';
import { InstagramOtherUserController } from './controllers/instagram-other-user.controller';

@Module({
  imports: [
    UserModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: UserSocProfile.name, schema: UserSocProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [InstagramMeController, InstagramOtherUserController],
  providers: [InstagramMeInsightsService, InstagramOtherUserService],
})
export class InstagramModule {}
