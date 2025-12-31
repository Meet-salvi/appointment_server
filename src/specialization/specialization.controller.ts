// src/specializations/specialization.controller.ts

import { Controller, Post, Body, Get } from '@nestjs/common';

import { SpecializationService } from './specialization.service';

@Controller('specializations')
export class SpecializationController {
  constructor(private readonly service: SpecializationService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.service.create(name);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
