import { ArrayMinSize, IsArray, IsEmail } from 'class-validator';

export class AddBoardMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  memberEmails!: string[];
}
