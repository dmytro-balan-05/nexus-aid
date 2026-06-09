import { IsInt, IsString, IsOptional, IsEmail, Min } from 'class-validator';

export class InitiateDonationDto {
  @IsString()
  campaignId: string;

  @IsInt()
  @Min(10)
  amount: number;

  @IsOptional()
  @IsString()
  donorName?: string;

  @IsOptional()
  @IsEmail()
  donorEmail?: string;
}
