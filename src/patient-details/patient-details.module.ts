import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientDetails } from './patient-details.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientDetails])],
  exports: [TypeOrmModule],
})
export class PatientDetailsModule {}
