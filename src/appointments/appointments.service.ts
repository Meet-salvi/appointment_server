import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment, AppointmentStatus } from './appointments.entity';
import { Doctor } from '../doctors/doctors.entity';
import { Patient } from '../patients/patients.entity';
import { Clinic } from '../clinics/clinics.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(Clinic)
    private clinicRepo: Repository<Clinic>,

    @InjectRepository(DoctorAvailability)
    private availabilityRepo: Repository<DoctorAvailability>,
  ) {}

  async bookAppointment(dto: CreateAppointmentDto, patientId: number) {
    // 1️⃣ Patient
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) throw new NotFoundException('Patient not found');

    // 2️⃣ Doctor + clinic
    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
      relations: ['clinic'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const clinic = doctor.clinic;

    // 3️⃣ Availability auto-detect
    const availability = await this.availabilityRepo.findOne({
      where: {
        doctor: { id: dto.doctorId },
        date: dto.appointment_date,
        is_available: true,
      },
    });

    if (!availability)
      throw new BadRequestException('Doctor not available on this date');

    // 4️⃣ Time validation
    if (
      dto.start_time < availability.start_time ||
      dto.end_time > availability.end_time
    ) {
      throw new BadRequestException('Outside availability time');
    }

    // 5️⃣ One patient → one session
    const alreadyBooked = await this.appointmentRepo.findOne({
      where: {
        patient,
        availability,
        appointment_date: dto.appointment_date,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (alreadyBooked) {
      throw new BadRequestException('Patient already booked for this session');
    }

    // 6️⃣ Slot already booked
    const slotBooked = await this.appointmentRepo.findOne({
      where: {
        doctor,
        availability,
        appointment_date: dto.appointment_date,
        start_time: dto.start_time,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (slotBooked) {
      throw new BadRequestException('Slot already booked');
    }

    // 7️⃣ Token
    const token =
      (await this.appointmentRepo.count({
        where: { doctor, appointment_date: dto.appointment_date },
      })) + 1;

    // 8️⃣ Save appointment
    const appointment = this.appointmentRepo.create({
      doctor,
      patient,
      clinic,
      availability,
      appointment_date: dto.appointment_date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      token_number: token,
      status: AppointmentStatus.BOOKED,
    });

    return this.appointmentRepo.save(appointment);
  }

  // ❌ CANCEL APPOINTMENT
  async cancelAppointment(id: number) {
    const appointment = await this.appointmentRepo.findOneBy({ id });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }

  // 📋 FETCH PATIENT APPOINTMENTS
  async getPatientAppointments(patientId: number) {
    return this.appointmentRepo.find({
      where: {
        patient: { id: patientId },
      },
      order: {
        appointment_date: 'DESC',
        start_time: 'ASC',
      },
      select: {
        id: true,
        appointment_date: true,
        start_time: true,
        end_time: true,
        status: true,
        token_number: true,
        created_at: true,
      },
    });
  }
}
