// src/patient-details/patient-details.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Patient } from '../patients/patients.entity';

@Entity()
export class PatientDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, patient => patient.details)
  patient: Patient;

  @Column()
  age: number;

  @Column()
  gender: string;

  @Column('decimal')
  weight: number;

  @Column('text')
  complaint: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
