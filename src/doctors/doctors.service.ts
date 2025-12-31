// src/doctors/doctors.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Doctor } from './doctors.entity';
import { Specialization } from '../specialization/specialization.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SearchDoctorDto } from './dto/search-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(Specialization)
    private readonly specializationRepo: Repository<Specialization>,
  ) {}

  //   CREATE profile
  async createProfile(doctorId: number, dto: CreateDoctorProfileDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const specialization = await this.specializationRepo.findOne({
      where: { id: dto.specializationId },
    });

    if (!specialization) {
      throw new NotFoundException('Specialization not found');
    }

    Object.assign(doctor, {
      experience_years: dto.experience_years,
      consultation_fee: dto.consultation_fee,
      qualification: dto.qualification,
      specialization,
    });

    return this.doctorRepo.save(doctor);
  }

  //   UPDATE profile
  async updateProfile(doctorId: number, dto: UpdateDoctorProfileDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: ['specialization'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Update specialization only if provided
    if (dto.specializationId) {
      const specialization = await this.specializationRepo.findOne({
        where: { id: dto.specializationId },
      });

      if (!specialization) {
        throw new NotFoundException('Specialization not found');
      }

      doctor.specialization = specialization;
    }

    // Update only provided fields
    if (dto.experience_years !== undefined) {
      doctor.experience_years = dto.experience_years;
    }

    if (dto.consultation_fee !== undefined) {
      doctor.consultation_fee = dto.consultation_fee;
    }

    if (dto.qualification !== undefined) {
      doctor.qualification = dto.qualification;
    }

    await this.doctorRepo.save(doctor);

    return { message: 'Doctor profile updated successfully' };
  }

  //   GET single doctor
  async getDoctor(doctorId: number) {
    return this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: ['user', 'clinic', 'specialization'],
    });
  }

  //   GET all doctors
  async getAllDoctors() {
    return this.doctorRepo.find({
      relations: ['user', 'clinic', 'specialization'],
    });
  }

  //   DELETE doctor
  async deleteDoctor(doctorId: number) {
    await this.doctorRepo.delete(doctorId);
    return { message: 'Doctor deleted successfully' };
  }

  // doctor search
  async searchDoctors(query: SearchDoctorDto) {
    const {
      name,
      specialization,
      minFee,
      maxFee,
      minExp,
      maxExp,
      page = 1,
      limit = 10,
    } = query;

    const qb = this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.specialization', 'specialization')
      .leftJoinAndSelect('doctor.clinic', 'clinic');

    // 🔍 Search by doctor name
    if (name) {
      qb.andWhere('LOWER(user.full_name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    // 🧠 Specialization filter
    if (specialization) {
      qb.andWhere('LOWER(specialization.name) LIKE LOWER(:spec)', {
        spec: `%${specialization}%`,
      });
    }

    // 💰 Fee filter
    if (minFee) {
      qb.andWhere('doctor.consultation_fee >= :minFee', { minFee });
    }

    if (maxFee) {
      qb.andWhere('doctor.consultation_fee <= :maxFee', { maxFee });
    }

    // Experience filter
    if (minExp) {
      qb.andWhere('doctor.experience_years >= :minExp', { minExp });
    }

    if (maxExp) {
      qb.andWhere('doctor.experience_years <= :maxExp', { maxExp });
    }

    // 📄 Pagination
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      total,
      page,
      limit,
      data,
    };
  }
}
