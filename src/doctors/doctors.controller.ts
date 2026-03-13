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
  UseGuards,
  Patch,
} from '@nestjs/common';

import { DoctorsService } from './doctors.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly service: DoctorsService) { }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  getProfile(@GetUser('sub') userId: number) {
    return this.service.findByUserId(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  updateMyProfile(
    @GetUser('sub') userId: number,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    // Need to get doctorId from userId first
    return this.service.findByUserId(userId).then((doctor) => {
      return this.service.updateProfile(doctor.id, dto);
    });
  }

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
