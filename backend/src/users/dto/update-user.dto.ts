import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Дмитро Балан', description: "Нове ім'я" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL аватарки',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => value !== '')
  @IsUrl()
  avatar?: string;
}
