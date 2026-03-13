import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patients.entity';
import { User } from '../users/users.entity';

@Injectable()
export class PatientsService {
    constructor(
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async findByUserId(userId: number) {
        const patient = await this.patientRepo.findOne({
            where: { user: { id: userId } },
            relations: ['user'],
        });
        if (!patient) {
            throw new NotFoundException('Patient not found');
        }
        return patient;
    }

    async getProfile(userId: number) {
        return this.findByUserId(userId);
    }

    async updateProfile(userId: number, updateData: any) {
        const patient = await this.findByUserId(userId);
        // Add logic to update patient specific fields or user fields if needed
        if (updateData.full_name || updateData.phone) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (user) {
                if (updateData.full_name) user.full_name = updateData.full_name;
                if (updateData.phone) user.phone = updateData.phone;
                await this.userRepo.save(user);
            }
        }
        return this.patientRepo.save(patient);
    }
}
