import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Дрони для 3-ї бригади', description: 'Назва збору' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Збираємо на 5 FPV дронів',
    description: 'Короткий опис',
  })
  @IsString()
  shortDescription: string;

  @ApiProperty({
    example: 'Детальний опис збору...',
    description: 'Повний опис',
  })
  @IsString()
  fullDescription: string;

  @ApiProperty({ example: 150000, description: 'Ціль збору в гривнях' })
  @IsInt()
  @Min(1)
  goalAmount: number;

  @ApiProperty({ example: 'Київ', description: 'Місцезнаходження' })
  @IsString()
  location: string;

  @ApiProperty({
    example: '3-тя окрема штурмова бригада',
    description: 'Бенефіціар',
  })
  @IsString()
  beneficiary: string;

  @ApiProperty({
    example: 'military',
    enum: ['military', 'medical', 'humanitarian', 'general'],
  })
  @IsString()
  category: string;

  @ApiPropertyOptional({ type: [String], example: ['https://...'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  urgentUntil?: string;
}
