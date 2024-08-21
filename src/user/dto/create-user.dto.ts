import { IsEmail, NotContains, IsNotEmpty, IsString, IsEnum } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../schemas/user.schema';
import { IsOptional } from 'class-validator';

export enum UserRole {
  Admin = 'admin',
  User = 'user'
}

export class CreateUserDto {

  @ApiProperty({
    description: "The first name of the user",
    example: "Alex"
  })
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({
    description: "The last name of the user",
    example: "Williams"
  })
  @IsString()
  readonly lastName: string;

  @ApiProperty({
    description: "The email of the user",
    example: "alex33@gmail.com"
  })
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty({
    description: "The password of the user account",
    example: "jdfk48!&(vs"
  })
  @IsString()
  @IsNotEmpty()
  @NotContains(' ')
  @IsOptional()
  readonly password?: string;

  @ApiProperty({
    description: "The ID of the user in social network",
    example: "4546584135564"
  })
  @IsNotEmpty()
  @IsOptional()
  readonly socNetId?: string;

  @ApiProperty({
    description: "The access token fom the social network",
    example: ""
  })
  @IsNotEmpty()
  @IsOptional()
  readonly socNetToken?: string;

  @ApiProperty({
    description: "The type of oauth",
    example: "exam@ple"
  })
  @IsNotEmpty()
  @IsOptional()
  readonly oauthName?: string;

}
