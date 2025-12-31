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
import { Specialization } from 'src/specialization/specialization.entity';

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

  @Column({ type: 'int', default: 0 })
  experience_years: number;

  @Column({ type: 'int', default: 0 })
  consultation_fee: number;

  @Column({ type: 'text', nullable: true })
  qualification: string;

  @Column({ default: false })
  is_verified: boolean;

  @ManyToOne(() => Specialization, (s) => s.doctors, { eager: true })
  specialization: Specialization;

  @OneToMany(() => DoctorAvailability, (availability) => availability.doctor)
  availability: DoctorAvailability[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];
}
