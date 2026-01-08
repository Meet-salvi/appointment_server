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

    // 🔒 Basic validation
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

    // 🔒 Required for WAVE logic
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

    // ❌ No change at all
    if (!isStartChanged && !isEndChanged) {
      return { message: 'No session change detected' };
    }

    // ⬆️ EXTEND
    if (newDuration > oldDuration) {
      return this.extendWave(availability, start_time, end_time);
    }

    // ⬇️ SHRINK
    if (newDuration < oldDuration) {
      return this.shrinkWave(availability, start_time, end_time, newDuration);
    }

    // 🔁 SAME DURATION BUT TIME SHIFT (FIXED CASE)
    await this.availabilityService.updateSessionTime(
      availability.id,
      start_time,
      end_time,
    );

    return {
      message: 'Wave session time updated',
    };
  }

  // ⬆️ EXTEND SESSION
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

  // ⬇️ SHRINK SESSION
  private async shrinkWave(
    availability: DoctorAvailability,
    newStartTime: string,
    newEndTime: string,
    newDuration: number,
  ) {
    const totalWaves = Math.floor(newDuration / availability.interval_minutes);

    const allowedCapacity = totalWaves * availability.capacity;

    const appointments = await this.appointmentService.findWaveAppointments(
      availability.doctor.id,
      availability.date!,
    );

    if (appointments.length > allowedCapacity) {
      const overflow = appointments
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
        .slice(allowedCapacity);

      for (const appt of overflow) {
        this.appointmentService.moveToNextDay(appt.id);
        this.appointmentService.notify(appt.id);
      }
    }

    await this.availabilityService.updateSessionTime(
      availability.id,
      newStartTime,
      newEndTime,
    );

    return {
      message: 'Wave session Shrink',
      movedAppointments: Math.max(0, appointments.length - allowedCapacity),
    };
  }

  // ⏱️ Time difference in minutes
  private diff(start: string, end: string): number {
    return (
      (new Date(`1970-01-01T${end}`).getTime() -
        new Date(`1970-01-01T${start}`).getTime()) /
      60000
    );
  }
}
