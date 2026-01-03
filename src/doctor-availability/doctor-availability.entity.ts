import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Doctor } from '../doctors/doctors.entity';
import { Appointment } from '../appointments/appointments.entity';

export enum ScheduleType {
  STREAM = 'STREAM',
  WAVE = 'WAVE',
}

@Entity('doctor_availability')
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.availability, {
    onDelete: 'CASCADE',
  })
  doctor: Doctor;

  @OneToMany(() => Appointment, (a) => a.availability)
  appointments: Appointment[];

  // RECURRING
  @Column({ nullable: true })
  day_of_week?: string;

  // CUSTOM
  @Column({ type: 'date', nullable: true })
  date?: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
  })
  schedule_type: ScheduleType;

  //ONE COLUMN FOR STREAM & WAVE
  @Column()
  interval_minutes: number;

  @Column()
  capacity: number;

  @Column({ default: true })
  is_available: boolean;
}
