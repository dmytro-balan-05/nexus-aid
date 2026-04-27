import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== '')
  @IsUrl()
  avatar?: string;
}
