import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { DoctorAvailability } from './doctor-availability.entity';

@Injectable()
export class ElasticWaveService {
  constructor(
    private readonly availabilityService: DoctorAvailabilityService,
    private readonly appointmentService: AppointmentsService,
  ) {}

  async apply(body: any) {
    const { doctorId, date, start_time, end_time } = body;

    // Basic validation
    if (!doctorId || !date || !start_time || !end_time) {
      throw new BadRequestException('Invalid payload');
    }

    const availability = await this.availabilityService.findWaveByDoctorAndDate(
      doctorId,
      date,
    );

    if (!availability || !availability.date) {
      throw new NotFoundException('Wave availability not found');
    }

    // Required for WAVE logic
    if (!availability.interval_minutes) {
      throw new BadRequestException(
        'interval_minutes is required for WAVE scheduling',
      );
    }

    const oldDuration = this.diff(
      availability.start_time,
      availability.end_time,
    );
    const newDuration = this.diff(start_time, end_time);

    const isStartChanged = availability.start_time !== start_time;
    const isEndChanged = availability.end_time !== end_time;

    // No change at all
    if (!isStartChanged && !isEndChanged) {
      return { message: 'No session change detected' };
    }

    //  EXTEND
    if (newDuration > oldDuration) {
      return this.extendWave(availability, start_time, end_time);
    }

    // SHRINK
    if (newDuration < oldDuration) {
      return this.shrinkWave(availability, start_time, end_time, newDuration);
    }

    // SAME DURATION BUT TIME SHIFT (FIXED CASE)
    await this.availabilityService.updateSessionTime(
      availability.id,
      start_time,
      end_time,
    );

    return {
      message: 'Wave session time updated',
    };
  }

  // EXTEND SESSION
  private async extendWave(
    availability: DoctorAvailability,
    newStartTime: string,
    newEndTime: string,
  ) {
    await this.availabilityService.updateSessionTime(
      availability.id,
      newStartTime,
      newEndTime,
    );

    return { message: 'Wave session extended' };
  }

  // SHRINK SESSION
  private async shrinkWave(
    availability: DoctorAvailability,
    newStartTime: string,
    newEndTime: string,
    newDuration: number,
  ) {
    // Recalculate capacity
    const totalWaves = Math.floor(newDuration / availability.interval_minutes);

    const allowedCapacity = totalWaves * availability.capacity;

    // Fetch booked appointments
    const appointments = await this.appointmentService.findWaveAppointments(
      availability.doctor.id,
      availability.date!,
    );

    // CHECK: do all patients fit?
    if (appointments.length <= allowedCapacity) {
      // Everyone fits → just update session
      await this.availabilityService.updateSessionTime(
        availability.id,
        newStartTime,
        newEndTime,
      );

      return {
        message: 'Wave session updated (all patients fit)',
        movedAppointments: 0,
      };
    }

    // Overflow exists
    const overflow = appointments.slice(allowedCapacity);

    // Move + notify only overflow patients
    for (const appt of overflow) {
      await this.appointmentService.moveToNextDay(appt.id);
      await this.appointmentService.notify(appt.id);
    }

    // Update session time
    await this.availabilityService.updateSessionTime(
      availability.id,
      newStartTime,
      newEndTime,
    );

    return {
      message: 'Wave session shrunk (overflow handled)',
      movedAppointments: overflow.length,
    };
  }

  // Time difference in minutes
  private diff(start: string, end: string): number {
    return (
      (new Date(`1970-01-01T${end}`).getTime() -
        new Date(`1970-01-01T${start}`).getTime()) /
      60000
    );
  }
}
