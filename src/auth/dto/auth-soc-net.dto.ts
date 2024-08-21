import { IsNotEmpty, IsString } from "@nestjs/class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum SocNetName {
    Facebook = "facebook",
    Instagram = "instagram",
    TikTok = "tiktok",
    Twitter = 'twitter',
    Google = 'google'
}

export class AuthSocNet {

    @ApiProperty({
      description: "Token from authorization through a social network ",
      example: ""
    })
    @IsString()
    @IsNotEmpty()
  readonly socNetToken: string;

    // @ApiProperty({
    //     description: "The name of the social network",
    //     example: "facebook"
    //   })
    //   @IsEnum (SocNetName)
    //   @IsNotEmpty()
    // readonly socNetName: SocNetName;
}