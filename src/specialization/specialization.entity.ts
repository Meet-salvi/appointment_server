// src/specializations/specialization.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { Doctor } from '../doctors/doctors.entity';

@Entity()
export class Specialization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => Doctor, (doctor) => doctor.specialization)
  doctors: Doctor[];
}
