import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNull } from 'typeorm';

import { Appointment, AppointmentStatus } from './appointments.entity';
import { Doctor } from '../doctors/doctors.entity';
import { Patient } from '../patients/patients.entity';
import { Clinic } from '../clinics/clinics.entity';
import { DoctorAvailability } from '../doctor-availability/doctor-availability.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ScheduleType } from '../doctor-availability/doctor-availability.entity';

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

  // BOOK APPOINTMENT
  async bookAppointment(dto: CreateAppointmentDto, patientId: number) {
    const patient = await this.patientRepo.findOneBy({ id: patientId });
    if (!patient) throw new NotFoundException('Patient not found');

    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
      relations: ['clinic'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const clinic = doctor.clinic;

    // date → day_of_week
    const dayOfWeek = new Date(dto.appointment_date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase();

    // Date-specific availability
    let availability = await this.availabilityRepo.findOne({
      where: {
        doctor: { id: dto.doctorId },
        date: dto.appointment_date,
        is_available: true,
      },
    });

    // Fallback to recurring availability
    if (!availability) {
      availability = await this.availabilityRepo.findOne({
        where: {
          doctor: { id: dto.doctorId },
          day_of_week: dayOfWeek,
          date: IsNull(),
          is_available: true,
        },
      });
    }

    if (!availability) {
      throw new BadRequestException('Doctor not available on this date');
    }

    // Time validation
    if (
      dto.start_time < availability.start_time ||
      dto.end_time > availability.end_time
    ) {
      throw new BadRequestException('Outside availability time');
    }

    // One patient → one session
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

    // Slot capacity
    const slotCount = await this.appointmentRepo.count({
      where: {
        doctor,
        availability,
        appointment_date: dto.appointment_date,
        start_time: dto.start_time,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (availability.schedule_type === ScheduleType.STREAM && slotCount >= 1) {
      throw new BadRequestException('Slot already booked');
    }

    if (
      availability.schedule_type === ScheduleType.WAVE &&
      slotCount >= availability.capacity
    ) {
      throw new BadRequestException('Slot capacity full');
    }

    // Token per slot
    const token = slotCount + 1;

    // Reporting time (10 min before)
    const REPORTING_BUFFER_MINUTES = 10;
    const reportingDate = new Date(`${dto.appointment_date}T${dto.start_time}`);
    reportingDate.setMinutes(
      reportingDate.getMinutes() - REPORTING_BUFFER_MINUTES,
    );

    const appointment = this.appointmentRepo.create({
      doctor,
      patient,
      clinic,
      availability,
      appointment_date: dto.appointment_date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      reporting_time: reportingDate.toTimeString().slice(0, 8),
      token_number: token,
      status: AppointmentStatus.BOOKED,
    });

    return this.appointmentRepo.save(appointment);
  }

  // CANCEL
  async cancelAppointment(id: number) {
    const appointment = await this.appointmentRepo.findOneBy({ id });
    if (!appointment) throw new NotFoundException('Appointment not found');

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }

  // PATIENT VIEW
  async getPatientAppointments(patientId: number) {
    return this.appointmentRepo.find({
      where: { patient: { id: patientId } },
      order: {
        appointment_date: 'DESC',
        start_time: 'ASC',
      },
      select: {
        id: true,
        appointment_date: true,
        start_time: true,
        end_time: true,
        reporting_time: true,
        status: true,
        token_number: true,
        created_at: true,
      },
    });
  }

  // DOCTOR VIEW (slot/session wise)
  async getDoctorAppointments(doctorId: number, date: string) {
    const appointments = await this.appointmentRepo.find({
      where: {
        doctor: { id: doctorId },
        appointment_date: date,
        status: AppointmentStatus.BOOKED,
      },
      relations: ['patient', 'patient.user'],
      order: { start_time: 'ASC' },
    });

    const grouped = {};

    for (const appt of appointments) {
      const key = appt.start_time;

      if (!grouped[key]) {
        grouped[key] = {
          start_time: appt.start_time,
          end_time: appt.end_time,
          total_patients: 0,
          patients: [],
        };
      }

      grouped[key].patients.push({
        id: appt.patient.id,
        name: appt.patient.user.full_name,
        reporting_time: appt.reporting_time,
        token: appt.token_number,
      });

      grouped[key].total_patients++;
    }

    return Object.values(grouped);
  }
}
