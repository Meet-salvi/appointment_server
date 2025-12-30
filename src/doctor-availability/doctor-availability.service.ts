import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorAvailability, ScheduleType } from './doctor-availability.entity';
import { Doctor } from '../doctors/doctors.entity';
import { CreateDoctorAvailabilityDto } from './doctor-availability.dto';

interface Slot {
  start_time: string;
  end_time: string;
  capacity: number;
}

@Injectable()
export class DoctorAvailabilityService {
  constructor(
    @InjectRepository(DoctorAvailability)
    private availabilityRepo: Repository<DoctorAvailability>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // ---------- HELPERS ----------
  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}:00`;
  }

  private getDayOfWeek(date: string): string {
    return new Date(date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase();
  }

  // ---------- SLOT GENERATION ----------
  private generateStreamSlots(a: DoctorAvailability): Slot[] {
    const slots: Slot[] = [];
    let start = this.timeToMinutes(a.start_time);
    const end = this.timeToMinutes(a.end_time);
    const duration = a.slot_duration_minutes || 15;

    while (start + duration <= end) {
      slots.push({
        start_time: this.minutesToTime(start),
        end_time: this.minutesToTime(start + duration),
        capacity: 1,
      });
      start += duration;
    }
    return slots;
  }

  private generateWaveSlots(a: DoctorAvailability): Slot[] {
    const slots: Slot[] = [];
    let start = this.timeToMinutes(a.start_time);
    const end = this.timeToMinutes(a.end_time);
    const interval = a.wave_interval_minutes || 30;

    while (start < end) {
      slots.push({
        start_time: this.minutesToTime(start),
        end_time: this.minutesToTime(start + interval),
        capacity: a.wave_capacity || 5,
      });
      start += interval;
    }
    return slots;
  }

  private generateSpecificSlot(a: DoctorAvailability): Slot[] {
    return [
      {
        start_time: a.start_time,
        end_time: a.end_time,
        capacity: a.capacity || 1,
      },
    ];
  }

  // ---------- CRUD ----------
  async createAvailability(doctorId: number, dto: CreateDoctorAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) throw new BadRequestException('Doctor not found');

    if (dto.start_time >= dto.end_time) {
      throw new BadRequestException('Invalid time range');
    }

    const availability = this.availabilityRepo.create({
      ...dto,
      doctor,
    });

    return this.availabilityRepo.save(availability);
  }

  async getAllAvailabilityByDoctor(
    doctorId: number,
  ): Promise<DoctorAvailability[]> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor not found');
    }

    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      order: {
        date: 'DESC',
        day_of_week: 'ASC',
        start_time: 'ASC',
      },
    });
  }

  async getSlots(doctorId: number, date: string): Promise<Slot[]> {
    const availability = await this.availabilityRepo.findOne({
      where: [
        { doctor: { id: doctorId }, date },
        {
          doctor: { id: doctorId },
          day_of_week: this.getDayOfWeek(date),
        },
      ],
      order: { date: 'DESC' }, // custom date first
    });

    if (!availability || !availability.is_available) return [];

    switch (availability.schedule_type) {
      case ScheduleType.STREAM:
        return this.generateStreamSlots(availability);
      case ScheduleType.WAVE:
        return this.generateWaveSlots(availability);
      case ScheduleType.SPECIFIC:
        return this.generateSpecificSlot(availability);
      default:
        return [];
    }
  }
}
