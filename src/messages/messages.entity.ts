// src/messages/messages.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Appointment } from '../appointments/appointments.entity';
import { User } from '../users/users.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Appointment, appointment => appointment.messages)
  appointment: Appointment;

  @ManyToOne(() => User)
  sender: User;

  @Column('text')
  message: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
