// src/appointments/appointments.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Doctor } from '../doctors/doctors.entity';
import { Patient } from '../patients/patients.entity';
import { Clinic } from '../clinics/clinics.entity';
import { Payment } from '../payments/payments.entity';
import { Message } from '../messages/messages.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';

export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments)
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient: Patient;

  @ManyToOne(() => Clinic, (clinic) => clinic.appointments)
  clinic: Clinic;

  @ManyToOne(() => DoctorAvailability)
  availability: DoctorAvailability;

  @Column({ type: 'date' })
  appointment_date: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  // BOOKED, CANCELLED
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.BOOKED,
  })
  status: AppointmentStatus;

  @Column()
  token_number: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToOne(() => Payment, (payment) => payment.appointment)
  @JoinColumn()
  payment: Payment;

  @OneToMany(() => Message, (message) => message.appointment)
  messages: Message[];
}
