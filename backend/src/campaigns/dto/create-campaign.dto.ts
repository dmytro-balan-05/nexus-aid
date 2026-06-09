import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  title: string;

  @IsString()
  shortDescription: string;

  @IsString()
  fullDescription: string;

  @IsInt()
  @Min(1)
  goalAmount: number;

  @IsString()
  location: string;

  @IsString()
  beneficiary: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsDateString()
  urgentUntil?: string;
}
