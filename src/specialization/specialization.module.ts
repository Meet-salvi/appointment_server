import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Specialization } from './specialization.entity';
import { SpecializationService } from './specialization.service';
import { SpecializationController } from './specialization.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Specialization])],
  providers: [SpecializationService],
  controllers: [SpecializationController],
  exports: [TypeOrmModule],
})
export class SpecializationModule {}
