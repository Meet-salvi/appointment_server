// src/doctors/doctors.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../users/users.entity';
import { Clinic } from '../clinics/clinics.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { Appointment } from '../appointments/appointments.entity';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctors)
  @JoinColumn()
  clinic: Clinic;

  @Column()
  experience_years: number;

  @Column()
  consultation_fee: number;

  @Column()
  is_verified: boolean;

  @OneToMany(() => DoctorAvailability, (availability) => availability.doctor)
  availability: DoctorAvailability[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];
}
