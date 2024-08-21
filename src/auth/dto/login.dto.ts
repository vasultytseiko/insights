import {
  IsEmail,
  NotContains,
  IsNotEmpty,
  IsString,
} from '@nestjs/class-validator';

export class loginDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @NotContains(' ')
  @IsNotEmpty()
  password: string;
}
