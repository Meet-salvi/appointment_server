import {
  IsEnum,
  IsOptional,
  Matches,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ScheduleType } from './doctor-availability.entity';

export class CreateDoctorAvailabilityDto {
  @IsOptional()
  date?: string;

  @IsOptional()
  day_of_week?: string;

  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  start_time: string;

  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  end_time: string;

  @IsEnum(ScheduleType)
  schedule_type: ScheduleType;

  @IsOptional()
  @IsNumber()
  slot_duration_minutes?: number;

  @IsOptional()
  @IsNumber()
  wave_interval_minutes?: number;

  @IsOptional()
  @IsNumber()
  wave_capacity?: number;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsBoolean()
  is_available: boolean;
}
