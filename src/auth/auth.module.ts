import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserSocProfile,
  UserSocProfileSchema,
} from 'src/user/schemas/user-soc-profile.schema';
import { User, UserSchema } from 'src/user/schemas/user.schema';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
    }),
    HttpModule,
    MongooseModule.forFeature([
      { name: UserSocProfile.name, schema: UserSocProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
