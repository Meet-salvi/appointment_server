import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from './appointments.entity';
import { Doctor } from '../doctors/doctors.entity';
import { Patient } from '../patients/patients.entity';
import { Clinic } from '../clinics/clinics.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';

import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Doctor,
      Patient,
      Clinic,
      DoctorAvailability,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
