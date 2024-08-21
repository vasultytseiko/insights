import {
  IsString,
  IsOptional,
  ValidateIf,
  IsUrl,
  Validate,
  ValidationArguments,
} from '@nestjs/class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchHashtagPostsDto {
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.hashtagId)
  hashtag: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.hashtag)
  hashtagId: string;

  @IsString()
  @IsOptional()
  //   @ValidateIf((o) => !o.before)
  //   @Validate(OnlyOnePropertyValidator, ['before'])
  after: string | null;

  @IsString()
  @IsOptional()
  //   @ValidateIf((o) => !o.after)
  //   @Validate(OnlyOnePropertyValidator, ['after'])
  before: string | null;
}
