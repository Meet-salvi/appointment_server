import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorAvailability, ScheduleType } from './doctor-availability.entity';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';

@Injectable()
export class DoctorAvailabilityService {
  constructor(
    @InjectRepository(DoctorAvailability)
    private repo: Repository<DoctorAvailability>,
  ) {}

  private validateInterval(
    scheduleType: ScheduleType,
    interval: number,
    start: string,
    end: string,
  ) {
    const startMin =
      Number(start.split(':')[0]) * 60 + Number(start.split(':')[1]);
    const endMin = Number(end.split(':')[0]) * 60 + Number(end.split(':')[1]);
    const duration = endMin - startMin;

    if (interval <= 0) {
      throw new BadRequestException('interval_minutes must be greater than 0');
    }

    if (interval > duration) {
      throw new BadRequestException(
        'interval_minutes cannot be greater than total availability duration',
      );
    }

    if (scheduleType === ScheduleType.STREAM && duration % interval !== 0) {
      throw new BadRequestException(
        'interval_minutes must divide evenly for STREAM scheduling',
      );
    }
  }

  private async checkOverlap(
    doctorId: number,
    condition: any,
    start: string,
    end: string,
  ) {
    const overlap = await this.repo
      .createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere(condition.query, condition.params)
      .andWhere('(a.start_time < :end AND a.end_time > :start)', {
        start,
        end,
      })
      .getOne();

    if (overlap) {
      throw new BadRequestException(
        'Availability already exists for this time range',
      );
    }
  }

  async createRecurring(doctorId: number, dto: CreateRecurringAvailabilityDto) {
    this.validateInterval(
      dto.schedule_type,
      dto.interval_minutes,
      dto.start_time,
      dto.end_time,
    );

    await this.checkOverlap(
      doctorId,
      {
        query: 'a.day_of_week = :day',
        params: { day: dto.day_of_week },
      },
      dto.start_time,
      dto.end_time,
    );

    return this.repo.save(
      this.repo.create({
        ...dto,
        doctor: { id: doctorId },
      }),
    );
  }

  async createCustom(doctorId: number, dto: CreateCustomAvailabilityDto) {
    this.validateInterval(
      dto.schedule_type,
      dto.interval_minutes,
      dto.start_time,
      dto.end_time,
    );

    await this.checkOverlap(
      doctorId,
      {
        query: 'a.date = :date',
        params: { date: dto.date },
      },
      dto.start_time,
      dto.end_time,
    );

    return this.repo.save(
      this.repo.create({
        ...dto,
        doctor: { id: doctorId },
      }),
    );
  }

  async getAllByDoctor(doctorId: number) {
    return this.repo.find({
      where: { doctor: { id: doctorId } },
      order: { start_time: 'ASC' },
    });
  }
}
