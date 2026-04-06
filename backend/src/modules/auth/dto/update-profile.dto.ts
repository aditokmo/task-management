import { IsOptional, IsString, MinLength, IsDataURI } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsString()
    profileImage?: string;
}
