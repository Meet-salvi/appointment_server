// src/users/users.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async getUsersByRole(role: UserRole) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Invalid role');
    }

    const relationsMap = {
      [UserRole.DOCTOR]: { doctor: true },
      [UserRole.PATIENT]: { patient: true },
      [UserRole.ADMIN]: { admin: true },
    };

    return this.userRepo.find({
      where: { role },
      relations: relationsMap[role],
    });
  }

  async findById(id: number) {
    return this.userRepo.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'admin'],
    });
  }
}
