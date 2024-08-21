import { IsEnum, IsString } from "class-validator";

export enum SocNetName {
    Facebook = 'facebook',
    Instagram = 'instagram',
    Twitter = 'twitter',
    Google = 'google'
}

export class socNetAuth {
    @IsString()
    readonly accessToken: string;

    @IsEnum(SocNetName)
    readonly socNetName: SocNetName;
}