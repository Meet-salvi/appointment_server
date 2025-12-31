import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchDoctorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minExp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxExp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;
}
