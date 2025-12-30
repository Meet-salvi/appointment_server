import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorAvailability } from './doctor-availability.entity';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { DoctorAvailabilityController } from './doctor-availability.controller';
import { Doctor } from '../doctors/doctors.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorAvailability, Doctor])],
  providers: [DoctorAvailabilityService],
  exports: [TypeOrmModule],
  controllers: [DoctorAvailabilityController],
})
export class DoctorAvailabilityModule {}
