// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  BadRequestException,
  UseGuards,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { Response, Request } from 'express';

import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { loginDto } from './dto/login.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthSocNet } from 'src/auth/dto/auth-soc-net.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import {
  ACCESS_TOKEN_OPTIONS,
  REFRESH_TOKEN_OPTIONS,
} from 'src/common/constants/constans';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly jwtAccessSecret: string = process.env.JWT_ACCESS_SECRET;
  private readonly accessTokenOptions: object = ACCESS_TOKEN_OPTIONS;
  private readonly refreshTokenOptions: object = REFRESH_TOKEN_OPTIONS;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('/sign-up')
  async registration(
    @Body() userDto: CreateUserDto | null,
    @Res({ passthrough: true }) response: Response,
  ) {
    const createdUser = await this.authService.registration(userDto);
    if (!createdUser) {
      response
        .status(409)
        .json({ status: 'conflict', code: 409, message: 'Email in use' });
      return;
    }
    const { firstName, lastName, email } = createdUser;
    response.status(201).json({
      status: 'created',
      code: 201,
      data: {
        firstName,
        lastName,
        email,
        message: 'User succesfully created',
      },
    });
    return;
  }

  @Post('sign-in')
  async login(
    @Request() request: any,
    @Body() loginDto: loginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens: any = await this.authService.login(loginDto);

    response.cookie('accessToken', tokens.accessToken, this.accessTokenOptions);

    response.cookie(
      'refreshToken',
      tokens.refreshToken,
      this.refreshTokenOptions,
    );

    response.status(200).json({
      status: 'success',
      code: 200,
      message: 'User successfully login',
      ...tokens,
    });
  }

  @Post('/oauth')
  async oauth(
    @Body() oauthDto: AuthSocNet,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.authBySoc(oauthDto);

    response.cookie('accessToken', tokens.accessToken, this.accessTokenOptions);

    response.cookie(
      'refreshToken',
      tokens.refreshToken,
      this.refreshTokenOptions,
    );

    response.status(200).json({
      status: 'success',
      code: 200,
      message: 'User successfully login',
      ...tokens,
    });
  }

  @Get('/me')
  async getCurrent(
    @Request() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const token = request.cookies.accessToken;
    if (!token)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const user = this.jwtService.verify(token, {
      secret: this.jwtAccessSecret,
    });

    const { _id, firstName, lastName, email, role } =
      await this.userService.findOne(user.id);
    const profiles = await this.userService.getSocProfiles(user.id);

    return { user: { _id, firstName, lastName, email, role, profiles } };
  }

  @Get('/refresh')
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies.refreshToken;

    if (!token)
      throw new BadRequestException({
        message: 'Refresh token does not exist',
      });
    const tokens = this.authService.refresh(token);

    response.cookie('accessToken', tokens.accessToken, accessTokenOptions);

    response.cookie('refreshToken', tokens.refreshToken, refreshTokenOptions);

    response.status(200).json({
      status: 'success',
      code: 200,
      data: { message: 'refresh success' },
    });
  }

  @Post('/sign-out')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.cookies.accessToken);

    response.clearCookie('refreshToken', this.accessTokenOptions);
    response.clearCookie('accessToken', this.refreshTokenOptions);

    response.status(204);
  }
}
