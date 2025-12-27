import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorAvailability } from './doctor-availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorAvailability])],
  exports: [TypeOrmModule],
})
export class DoctorAvailabilityModule {}
