import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Clinic } from './clinics.entity';
import { Doctor } from '../doctors/doctors.entity';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepo: Repository<Clinic>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // 1️⃣ Create Clinic
  async create(data: Partial<Clinic>) {
    const clinic = this.clinicRepo.create(data);
    return this.clinicRepo.save(clinic);
  }

  // 2️⃣ Fetch All Clinics
  async findAll() {
    return this.clinicRepo.find();
  }

  // 3️⃣ Fetch Clinic by ID (with doctors)
  async findOne(id: number) {
    const clinic = await this.clinicRepo.findOne({
      where: { id },
      relations: ['doctors'],
    });

    if (!clinic) throw new NotFoundException('Clinic not found');
    return clinic;
  }

  // 4️⃣ Assign Doctor to Clinic
  async assignDoctor(clinicId: number, doctorId: number) {
    const clinic = await this.clinicRepo.findOneBy({ id: clinicId });
    if (!clinic) throw new NotFoundException('Clinic not found');

    const doctor = await this.doctorRepo.findOneBy({ id: doctorId });
    if (!doctor) throw new NotFoundException('Doctor not found');

    doctor.clinic = clinic;
    return this.doctorRepo.save(doctor);
  }
}
