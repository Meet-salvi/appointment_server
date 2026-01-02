import { IsNumber, IsDateString, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  doctorId: number;

  @IsDateString()
  appointment_date: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}
