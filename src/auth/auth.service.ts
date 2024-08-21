import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { loginDto } from './dto/login.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AuthService {
  private readonly jwtAccessSecret: string = process.env.JWT_ACCESS_SECRET;
  private readonly jwtRefreshSecret: string = process.env.JWT_REFRESH_SECRET;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {}

  async registration(userDto: CreateUserDto) {
    return await this.userService.registration(userDto);
  }

  async authBySoc(oauthDto) {
    try {
      const { socNetToken } = oauthDto;

      const userData = await this.getUserDataGoogle(socNetToken);
      const { email, name, id } = userData;

      const registeredUser = await this.userService.findByEmail(email);
      if (!registeredUser) {
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        const userDataForRegistration: CreateUserDto = {
          firstName,
          lastName,
          email,
          socNetId: id,
          socNetToken,
          oauthName: 'google',
        };
        const createdUser = await this.userService.registration(
          userDataForRegistration,
        );

        return this.loginSocNet(createdUser._id.toString());
      }

      if (registeredUser) {
        const { _id } = registeredUser;
        await this.userService.update(_id.toString(), {
          socNetId: id,
          socNetToken,
        });

        return this.loginSocNet(_id.toString());
      }
    } catch (error) {
      throw new HttpException('Incorrect intake data', HttpStatus.BAD_REQUEST);
    }
  }

  async login(loginDto: loginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new HttpException(
        'Incorrect login or password',
        HttpStatus.BAD_REQUEST,
      );
    }
    const passwordEquals = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (passwordEquals) {
      const token = this.generateToken(user.id);
      return token;
    } else {
      throw new HttpException(
        'Incorrect login or password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async loginSocNet(id: string) {
    try {
      const tokens = this.generateToken(id);
      return tokens;
    } catch (error) {
      throw new HttpException(
        'Incorrect login or password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  refresh(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.jwtRefreshSecret,
      });

      return this.generateToken(payload.id);
    } catch (error) {
      throw new HttpException('Token was not verify', HttpStatus.UNAUTHORIZED);
    }
  }

  logout(token: string) {
    try {
      const { id } = this.jwtService.verify(token, {
        secret: this.jwtAccessSecret,
      });

      const user = this.userService.findOne(id);

      return user;
    } catch (error) {
      throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
    }
  }

  private generateToken(id: string) {
    const accessToken = this.jwtService.sign(
      { id },
      { expiresIn: '1h', secret: this.jwtAccessSecret },
    );
    const refreshToken = this.jwtService.sign(
      { id },
      { expiresIn: '24h', secret: this.jwtRefreshSecret },
    );
    return { accessToken, refreshToken };
  }

  private async getUserDataGoogle(token: string) {
    const { data } = await this.httpService.axiosRef.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const { sub, name, email } = data;
    return {
      id: sub,
      name,
      email,
    };
  }
}
