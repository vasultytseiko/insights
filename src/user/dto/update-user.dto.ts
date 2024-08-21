import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from '@nestjs/class-validator';
import { IsEmail, IsNotEmpty, IsString, NotContains } from 'class-validator';
import { UserRole } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {

}
