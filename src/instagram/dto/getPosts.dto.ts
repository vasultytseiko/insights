import {
  IsString,
  IsOptional,
  ValidateIf,
  IsUrl,
  Validate,
  ValidationArguments,
} from '@nestjs/class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// class OnlyOnePropertyValidator {
//   validate(value: any, args: ValidationArguments) {
//     const [relatedPropertyName] = args.constraints;
//     const relatedValue = (args.object as any)[relatedPropertyName];
//     return (value && !relatedValue) || (!value && relatedValue);
//   }

//   defaultMessage(args: ValidationArguments) {
//     const [relatedPropertyName] = args.constraints;
//     return `Only one of ${args.property} or ${relatedPropertyName} should be provided.`;
//   }
// }

export class GetPostsDto {
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
