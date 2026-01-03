import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';

@Controller('doctor-availability')
export class DoctorAvailabilityController {
  constructor(private readonly service: DoctorAvailabilityService) {}

  @Post('recurring/:doctorId')
  createRecurring(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: CreateRecurringAvailabilityDto,
  ) {
    return this.service.createRecurring(doctorId, dto);
  }

  @Post('custom/:doctorId')
  createCustom(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: CreateCustomAvailabilityDto,
  ) {
    return this.service.createCustom(doctorId, dto);
  }

  @Get(':doctorId')
  getAll(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.service.getAllByDoctor(doctorId);
  }
}
