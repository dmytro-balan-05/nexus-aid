import { IsInt, IsString, IsOptional, IsEmail, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitiateDonationDto {
  @ApiProperty({ example: 'clx1234...', description: 'ID кампанії' })
  @IsString()
  campaignId: string;

  @ApiProperty({ example: 500, description: 'Сума донату в гривнях (мін. 10)' })
  @IsInt()
  @Min(10)
  amount: number;

  @ApiPropertyOptional({ example: 'Анонімний донор' })
  @IsOptional()
  @IsString()
  donorName?: string;

  @ApiPropertyOptional({ example: 'donor@example.com' })
  @IsOptional()
  @IsEmail()
  donorEmail?: string;
}
