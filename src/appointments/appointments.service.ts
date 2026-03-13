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
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

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

    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,

    private readonly notificationService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  // BOOK APPOINTMENT
  async bookAppointment(dto: CreateAppointmentDto, patientId: number) {
    const patient = await this.patientRepo.findOne({ where: { id: patientId }, relations: ['user'] });
    if (!patient) throw new NotFoundException('Patient not found');

    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
      relations: ['clinic', 'user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const clinic = doctor.clinic;

    // date → day_of_week
    const dayOfWeek = new Date(dto.appointment_date)
      .toLocaleDateString('en-US', { weekday: 'long' });

    // Date-specific availability
    let availability = await this.availabilityRepo.findOne({
      where: {
        doctor: { id: dto.doctorId },
        date: dto.appointment_date,
        is_available: true,
      },
    });

    // Fallback to recurring availability (case-insensitive)
    if (!availability) {
      availability = await this.availabilityRepo
        .createQueryBuilder('a')
        .where('a.doctorId = :doctorId', { doctorId: dto.doctorId })
        .andWhere('LOWER(a.day_of_week) = LOWER(:day)', { day: dayOfWeek })
        .andWhere('a.date IS NULL')
        .andWhere('a.is_available = true')
        .getOne();
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

    // One patient → one active booking per doctor per day
    const alreadyBooked = await this.appointmentRepo.findOne({
      where: {
        patient: { id: patientId },
        doctor: { id: dto.doctorId },
        appointment_date: dto.appointment_date,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (alreadyBooked) {
      throw new BadRequestException('You already have an active booking with this doctor for this date. Cancel it first to rebook.');
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

    const saved = await this.appointmentRepo.save(appointment);

    // Send email notification to doctor
    try {
      if (doctor.user?.email) {
        await this.mailService.sendAppointmentNotification(
          doctor.user.email,
          doctor.user.full_name || 'Doctor',
          patient.user?.full_name || 'Patient',
          dto.appointment_date,
          dto.start_time,
          dto.end_time,
          token,
        );
      }
    } catch (e) {
      console.error('Appointment email notification failed:', e);
    }

    return saved;
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
      relations: ['doctor', 'doctor.user', 'doctor.specialization', 'doctor.clinic'],
      order: {
        appointment_date: 'DESC',
        start_time: 'ASC',
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

  // WAVE APPOINTMENTS FOR ELASTIC SERVICE
  findWaveAppointments(doctorId: number, date: string) {
    return this.repo.find({
      where: {
        doctor: { id: doctorId },
        appointment_date: date,
        status: AppointmentStatus.BOOKED,
      },
      relations: ['doctor', 'availability'],
      order: { created_at: 'ASC' },
    });
  }

  // STREAM → sequential order
  findStreamAppointments(doctorId: number, date: string) {
    return this.repo.find({
      where: {
        doctor: { id: doctorId },
        appointment_date: date,
        status: AppointmentStatus.BOOKED,
      },
      order: { start_time: 'ASC' },
    });
  }

  // MOVE APPOINTMENT TO NEXT DAY
  async moveToNextDay(appointmentId: number): Promise<void> {
    const appointment = await this.repo.findOne({
      where: { id: appointmentId },
      relations: ['doctor'],
    });

    if (!appointment) return;

    // 👉 Find next date (simple logic)
    const next = new Date(appointment.appointment_date);
    next.setDate(next.getDate() + 1);

    const nextDate = next.toISOString().split('T')[0];

    await this.repo.update(
      { id: appointmentId },
      {
        appointment_date: nextDate,
        // status stays BOOKED
      },
    );
  }

  // Notification
  async notify(appointmentId: number): Promise<void> {
    const appointment = await this.repo.findOne({
      where: { id: appointmentId },
    });

    // Do NOT break elastic flow
    if (!appointment) return;

    try {
      await this.notificationService.send({
        title: 'Appointment Rescheduled',
        message: 'Your appointment was moved due to a doctor schedule update.',
        appointmentId: appointment.id,
      });
    } catch (error) {
      console.error(
        `Notification failed for appointment ${appointmentId}`,
        error,
      );
    }
  }
}
