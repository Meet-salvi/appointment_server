import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Doctor } from './doctors.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { SpecializationModule } from '../specialization/specialization.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor]),
    SpecializationModule,
    forwardRef(() => AuthModule),
  ],
  providers: [DoctorsService],
  controllers: [DoctorsController],
  exports: [DoctorsService],
})
export class DoctorsModule { }
