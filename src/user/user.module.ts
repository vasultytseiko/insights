import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { UserController } from './user.controller';
// import { RoleModule } from 'src/role/role.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import {
  UserSocProfile,
  UserSocProfileSchema,
} from './schemas/user-soc-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: UserSocProfile.name, schema: UserSocProfileSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
