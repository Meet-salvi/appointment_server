import { Controller, Post, Body, Get, Param } from '@nestjs/common';

import { ClinicsService } from './clinics.service';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly service: ClinicsService) {}

  // Create clinic
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  // Get all clinics
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Get clinic with doctors
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  // Assign doctor to clinic
  @Post(':clinicId/doctor/:doctorId')
  assignDoctor(
    @Param('clinicId') clinicId: number,
    @Param('doctorId') doctorId: number,
  ) {
    return this.service.assignDoctor(+clinicId, +doctorId);
  }
}
