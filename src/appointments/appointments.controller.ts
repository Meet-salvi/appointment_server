import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // Patient books appointment
  @Post('book/:patientId')
  book(
    @Param('patientId') patientId: number,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.service.bookAppointment(dto, +patientId);
  }

  // Patient cancels appointment
  @Post('cancel/:id')
  cancel(@Param('id') id: number) {
    return this.service.cancelAppointment(+id);
  }

  // Patient views own appointments
  @Get('patient/:patientId')
  getPatientAppointments(@Param('patientId') patientId: number) {
    return this.service.getPatientAppointments(+patientId);
  }

  // Doctor views appointments (slot/session wise)
  @Get('doctor/:doctorId')
  getDoctorAppointments(
    @Param('doctorId') doctorId: number,
    @Query('date') date: string,
  ) {
    return this.service.getDoctorAppointments(+doctorId, date);
  }
}
