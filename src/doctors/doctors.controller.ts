// src/doctors/doctors.controller.ts

import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { DoctorsService } from './doctors.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly service: DoctorsService) {}

  //   SEARCH doctors
  @Get('search')
  searchDoctors(@Query() query: SearchDoctorDto) {
    return this.service.searchDoctors(query);
  }

  // CREATE profile
  @Post(':doctorId/profile')
  createProfile(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: CreateDoctorProfileDto,
  ) {
    return this.service.createProfile(doctorId, dto);
  }

  // UPDATE profile
  @Put(':doctorId/profile')
  updateProfile(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.service.updateProfile(doctorId, dto);
  }

  // GET single doctor
  @Get(':doctorId')
  getDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.service.getDoctor(doctorId);
  }

  // GET all doctors
  @Get()
  getAllDoctors() {
    return this.service.getAllDoctors();
  }

  // DELETE doctor
  @Delete(':doctorId')
  deleteDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.service.deleteDoctor(doctorId);
  }
}
