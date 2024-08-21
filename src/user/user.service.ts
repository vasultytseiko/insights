import { Injectable, BadRequestException, HttpStatus, HttpException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

import { UserSocProfile } from './schemas/user-soc-profile.schema';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(UserSocProfile.name)
    private readonly userSocProfileModel: Model<UserSocProfile>,
    // private readonly httpService: HttpService
  ) { }

  async registration(createUserDto: CreateUserDto) {

    try {
      const { ...userData } = createUserDto;
      const isUresRegistered = await this.findByEmail(userData.email);
      if (isUresRegistered) return;
      if (userData.password) {
        const hashPassword = await bcrypt.hash(userData.password, 5);
      userData.password = hashPassword;
      }
      
      
      const createdUser = await this.userModel.create(userData);
      createdUser.save();

      return createdUser;
    } catch (error) {
      throw new HttpException("Can't add user to DB", HttpStatus.BAD_REQUEST)
    }
  }

  // // async createUserSoc({socNetUserId: string, socNetToken: string, socNetName: string, token: string}) {
      // this.userModel.create({firstName: })
  // }

  // async registrationByOAuth(socNetUserId: string, socNetToken: string, socNetName: string, owner) {
  //   try {
  //     const user = await this.findUserInSocNetDB(socNetName, socNetUserId);
  //     if (!user) {
  //       const createdUser = await this.userSocProfileModel.create({
  //         socNetName,
  //         socNetToken,
  //         socNetUserId,
  //         instagramBusinessId: '',
  //         username: '',
  //         owner
  //       });
  //       await createdUser.save();
  //       return createdUser;
  //     }
      
      

  //   } catch (error) {
  //     throw new HttpException("Can't add user to social DB", HttpStatus.BAD_REQUEST)
  //   }
  // }
  
  // async createUserInSocDB(data: UserSocProfile) { 
  //   return await this.userSocProfileModel.create(data)
  // }

  async getSocProfiles(id) {
    const profiles = await this.userSocProfileModel.find({owner: id});
    return profiles;
  }


  async findAll() {
    try {
      const users = await this.userModel.find().select('-password');

      if (!users) {
        throw {
          message: "Users not found",
          code: HttpStatus.NOT_FOUND
        }
      }

      return users;
    } catch (error) {
      throw new HttpException("No users found", HttpStatus.NOT_FOUND)
    }
  }

  async findOne(id: string) {
    try {
      return await this.userModel.findById(id).select('-password');
    } catch (error) {
      throw new HttpException("No user found", HttpStatus.NOT_FOUND)
    }
  }

  async getRole(userId: string) {

  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email });

    return user;
  }

  async updatePassword(id: string, password: string) {

  }

  async updateUserRole(roleId: string) {

  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });


      if (!updatedUser) {
        throw {
          message: "User not found",
          code: HttpStatus.NOT_FOUND
        }
      }

      return updatedUser;
    } catch (error) {
      throw new HttpException("No users found", HttpStatus.NOT_FOUND)
    }


  }

  // async findUserInSocNetDB(socNetName: string, socNetUserId: string) {
  //   const user = await this.userSocProfileModel.findOne({ socNetName, socNetUserId });

  //   return user;
  // }

  // async findProfileByOwner(socNetName: string, ownerId: string) {

  //   const user = await this.userSocProfileModel.findOne({ socNetName, owner: ownerId })
  //   return user
  // }

  // async updateSocToken(socNetName: string, socNetToken: string, owner: object) {
  //   return await this.userModel.findOneAndUpdate({ socNetName, owner }, { socNetToken }, {
  //     new: true
  //   })

  // }

  // async updateUserSocData(id, data) {
  //      return await this.userSocProfileModel.findByIdAndUpdate(id, data, {new: true})
  // }

  

  // async getUsername(id: string) {
  //   return await this.httpService.axiosRef.get(`https://graph.facebook.com/v19.0/${id}?fields=username`)
  // }

}
