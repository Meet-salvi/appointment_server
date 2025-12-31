import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Doctor } from './doctors.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { SpecializationModule } from '../specialization/specialization.module';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor]), SpecializationModule],
  providers: [DoctorsService],
  controllers: [DoctorsController],
})
export class DoctorsModule {}
