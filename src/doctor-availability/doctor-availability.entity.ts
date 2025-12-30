import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from '../doctors/doctors.entity';

export enum ScheduleType {
  STREAM = 'STREAM',
  WAVE = 'WAVE',
  SPECIFIC = 'SPECIFIC',
}

@Entity('doctor_availability')
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.availability, {
    onDelete: 'CASCADE',
  })
  doctor: Doctor;

  // Custom date (override)
  @Column({ type: 'date', nullable: true })
  date?: string;

  // Recurring rule
  @Column({ nullable: true })
  day_of_week?: string; // MONDAY, TUESDAY...

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
    default: ScheduleType.STREAM,
  })
  schedule_type: ScheduleType;

  // STREAM
  @Column({ nullable: true })
  slot_duration_minutes?: number;

  // WAVE
  @Column({ nullable: true })
  wave_interval_minutes?: number;

  @Column({ nullable: true })
  wave_capacity?: number;

  // SPECIFIC
  @Column({ nullable: true })
  capacity?: number;

  @Column({ default: true })
  is_available: boolean;
}
