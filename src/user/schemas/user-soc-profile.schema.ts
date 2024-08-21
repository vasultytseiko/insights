import { HydratedDocument, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from './user.schema';
import { IsOptional } from 'class-validator';

export type UserSocProfileDocument = HydratedDocument<UserSocProfile>;

@Schema({ timestamps: true, versionKey: false })
export class UserSocProfile {

    @Prop({ required: true })
    socNetName: string;

    @Prop({ required: true })
    socNetToken: string;

    @Prop({ required: true })
    socNetUserId: string;

    @Prop()
    @IsOptional()
    businessId?: string;

    @Prop()
    @IsOptional()
    businessName?: string;

    @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
    owner: User;
};


export const UserSocProfileSchema = SchemaFactory.createForClass(UserSocProfile);