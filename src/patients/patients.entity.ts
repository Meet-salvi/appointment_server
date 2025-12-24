// src/patients/patients.entity.ts
import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/users.entity';
import { Appointment } from '../appointments/appointments.entity';
import { PatientDetails } from '../patient-details/patient-details.entity';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => PatientDetails, details => details.patient)
  details: PatientDetails[];
}
