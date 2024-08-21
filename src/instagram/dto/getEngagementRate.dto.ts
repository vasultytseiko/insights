import { IsString } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetEngagementRateDto {
  @ApiProperty()
  @IsString()
  sinceMonth: string;

  @ApiProperty()
  @IsString()
  untilMonth: string;
}
