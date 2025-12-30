import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import { DoctorAvailabilityService } from './doctor-availability.service';
import { CreateDoctorAvailabilityDto } from './doctor-availability.dto';
import { Slot } from './doctor-availability.types';

@Controller('doctor-availability')
export class DoctorAvailabilityController {
  constructor(private readonly service: DoctorAvailabilityService) {}

  // CREATE availability (recurring / custom / stream / wave / specific)
  @Post(':doctorId')
  create(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: CreateDoctorAvailabilityDto,
  ) {
    return this.service.createAvailability(doctorId, dto);
  }

  // GET generated slots for a date
  @Get(':doctorId/slots')
  getSlots(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
  ): Promise<Slot[]> {
    return this.service.getSlots(doctorId, date);
  }

  // GET all availability for a doctor
  @Get(':doctorId')
  getAllAvailability(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.service.getAllAvailabilityByDoctor(doctorId);
  }
}
