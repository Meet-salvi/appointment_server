import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './clinics.entity';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { Doctor } from '../doctors/doctors.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic, Doctor])],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [TypeOrmModule],
})
export class ClinicsModule {}
