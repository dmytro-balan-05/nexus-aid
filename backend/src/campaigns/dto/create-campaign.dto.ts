import { IsString, IsInt, IsOptional, Min, IsArray } from 'class-validator';

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
  @IsString({ each: true }) // Кожен елемент масиву має бути рядком
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}
