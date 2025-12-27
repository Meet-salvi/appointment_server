import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './clinics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  exports: [TypeOrmModule],
})
export class ClinicsModule {}
