// src/doctor-availability/doctor-availability.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Doctor } from '../doctors/doctors.entity';


@Entity()
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, doctor => doctor.availability)
  doctor: Doctor;

  @Column()
  day_of_week: string;

  @Column()
  session: string; // Morning | Afternoon | Evening

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;
}
