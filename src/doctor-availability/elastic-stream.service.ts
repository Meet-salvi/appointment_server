import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class ElasticStreamService {
  constructor(
    private readonly availabilityService: DoctorAvailabilityService,
    private readonly appointmentService: AppointmentsService,
  ) {}

  async apply(body: any) {
    const { doctorId, date, start_time, end_time } = body;

    if (!doctorId || !date || !start_time || !end_time) {
      throw new BadRequestException('Invalid payload');
    }

    const availability =
      await this.availabilityService.findStreamByDoctorAndDate(doctorId, date);

    if (!availability) {
      throw new NotFoundException('Stream availability not found');
    }

    const oldDuration = this.diff(
      availability.start_time,
      availability.end_time,
    );
    const newDuration = this.diff(start_time, end_time);

    // EXTEND
    if (newDuration > oldDuration) {
      await this.availabilityService.updateSessionTime(
        availability.id,
        start_time,
        end_time,
      );
      return { message: 'Stream session extended' };
    }

    // SHRINK
    if (newDuration < oldDuration) {
      return this.shrinkStream(availability, start_time, end_time);
    }

    // SHIFT ONLY
    await this.availabilityService.updateSessionTime(
      availability.id,
      start_time,
      end_time,
    );

    return { message: 'Stream session updated' };
  }

  private async shrinkStream(availability, newStart: string, newEnd: string) {
    const newDuration = this.diff(newStart, newEnd);
    const allowedSlots = Math.floor(
      newDuration / availability.interval_minutes,
    );

    const appointments = await this.appointmentService.findStreamAppointments(
      availability.doctor.id,
      availability.date,
    );

    // All patients fit
    if (appointments.length <= allowedSlots) {
      await this.availabilityService.updateSessionTime(
        availability.id,
        newStart,
        newEnd,
      );

      return {
        message: 'Stream session updated (all patients fit)',
        movedAppointments: 0,
      };
    }

    // Overflow exists
    const overflow = appointments.slice(allowedSlots);

    for (const appt of overflow) {
      await this.appointmentService.moveToNextDay(appt.id);
      await this.appointmentService.notify(appt.id);
    }

    await this.availabilityService.updateSessionTime(
      availability.id,
      newStart,
      newEnd,
    );

    return {
      message: 'Stream session shrink',
      movedAppointments: overflow.length,
    };
  }

  private diff(start: string, end: string): number {
    return (
      (new Date(`1970-01-01T${end}`).getTime() -
        new Date(`1970-01-01T${start}`).getTime()) /
      60000
    );
  }
}
