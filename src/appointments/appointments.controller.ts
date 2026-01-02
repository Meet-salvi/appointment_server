import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // patientId mocked as 1 (replace with auth later)
  @Post('book/:patientId')
  book(
    @Param('patientId') patientId: number,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.service.bookAppointment(dto, +patientId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: number) {
    return this.service.cancelAppointment(+id);
  }

  @Get(':patientId')
  getPatient(@Param('patientId') patientId: number) {
    return this.service.getPatientAppointments(+patientId);
  }
}
