import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorAvailability } from './doctor-availability.entity';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { DoctorAvailabilityController } from './doctor-availability.controller';
import { ElasticWaveService } from './elastic-wave.service';
import { Doctor } from '../doctors/doctors.entity';
import { Appointment } from '../appointments/appointments.entity';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoctorAvailability, Doctor, Appointment]),
    AppointmentsModule,
  ],
  providers: [DoctorAvailabilityService, ElasticWaveService],
  controllers: [DoctorAvailabilityController],
})
export class DoctorAvailabilityModule {}
