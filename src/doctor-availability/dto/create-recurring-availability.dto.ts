import {
  IsEnum,
  IsNumber,
  IsBoolean,
  Matches,
  IsString,
} from 'class-validator';
import { ScheduleType } from './../doctor-availability.entity';

export class CreateRecurringAvailabilityDto {
  @IsString()
  day_of_week: string;

  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  start_time: string;

  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
  end_time: string;

  @IsEnum(ScheduleType)
  schedule_type: ScheduleType;

  // STREAM → slot duration
  // WAVE → wave interval
  @IsNumber()
  interval_minutes: number;

  @IsNumber()
  capacity: number;

  @IsBoolean()
  is_available: boolean;
}
