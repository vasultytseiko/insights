import { Controller, Get, Param, UseGuards, Post, Body, Patch, Request, Res, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { loginDto } from 'src/auth/dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiProduces, ApiProperty, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly jwtRefreshSecret: string = process.env.JWT_REFRESH_SECRET;
  private readonly jwtAccessSecret: string = process.env.JWT_ACCESS_SECRET;


  constructor(private readonly userService: UserService, private readonly jwtService: JwtService,) { }
  

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Get('')
  findAll() {
    return this.userService.findAll();
  }

  @Patch('/update/:id')
  async updateUser(@Param('id') id: string, @Body() userDto: UpdateUserDto) {
    const { firstName, lastName, role } = await this.userService.update(id, userDto);
    return { firstName, lastName, role }
  }

}
