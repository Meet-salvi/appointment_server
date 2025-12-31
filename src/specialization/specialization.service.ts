// src/specializations/specialization.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Specialization } from './specialization.entity';

@Injectable()
export class SpecializationService {
  constructor(
    @InjectRepository(Specialization)
    private readonly repo: Repository<Specialization>,
  ) {}

  create(name: string) {
    return this.repo.save({ name });
  }

  findAll() {
    return this.repo.find();
  }
}
