// src/payments/payments.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Appointment } from '../appointments/appointments.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Appointment, appointment => appointment.payment)
  @JoinColumn()
  appointment: Appointment;

  @Column('decimal')
  amount: number;

  @Column()
  payment_method: string;

  @Column()
  payment_status: string; // Paid | Pending | Refunded

  @Column({ type: 'timestamp' })
  payment_date: Date;
}
