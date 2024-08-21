import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { User, UserSchema } from './user/schemas/user.schema';
import { InstagramModule } from './instagram/instagram.module';
import {
  UserSocProfile,
  UserSocProfileSchema,
} from './user/schemas/user-soc-profile.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSocProfile.name, schema: UserSocProfileSchema },
    ]),
    UserModule,
    AuthModule,
    InstagramModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}
