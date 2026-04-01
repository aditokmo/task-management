import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBoardDto {
    @IsString()
    @MinLength(2)
    @MaxLength(60)
    name!: string;

    @IsOptional()
    @IsArray()
    @IsEmail({}, { each: true })
    memberEmails?: string[];
}
