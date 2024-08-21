import { IsOptional } from '@nestjs/class-validator';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../dto/create-user.dto';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {

    @Prop({ required: true })
    readonly firstName: string;

    @Prop({ default: '' })
    @IsOptional()
    readonly lastName?: string;

    @Prop({ required: true })
    readonly email: string;

    @Prop({ required: true, default: UserRole.User })
    readonly role: string;

    @Prop({ default: '' })
    @IsOptional()
    readonly password: string;


    @Prop({ default: '' })
    @IsOptional()
    readonly socNetId?: string;


    @Prop({ default: '' })
    @IsOptional()
    readonly socNetToken?: string;

    @Prop({ default: '' })
    @IsOptional()
    readonly oauthName?: string;

    // @Prop()
    // @IsOptional()
    // _id: string;

};


export const UserSchema = SchemaFactory.createForClass(User);