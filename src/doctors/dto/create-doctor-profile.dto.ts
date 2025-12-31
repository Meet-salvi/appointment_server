import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateDoctorProfileDto {
  @IsInt()
  experience_years: number;

  @IsInt()
  consultation_fee: number;

  @IsNotEmpty()
  qualification: string;

  @IsInt()
  specializationId: number;
}
