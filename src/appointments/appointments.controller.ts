import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PatientsService } from '../patients/patients.service';
import { DoctorsService } from '../doctors/doctors.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(
    private readonly service: AppointmentsService,
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
  ) { }

  // Patient books appointment
  @Post('book')
  @Roles(UserRole.PATIENT)
  async book(@GetUser('sub') userId: number, @Body() dto: CreateAppointmentDto) {
    const patient = await this.patientsService.findByUserId(userId);
    return this.service.bookAppointment(dto, patient.id);
  }

  // Patient cancels appointment
  @Post('cancel/:id')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR)
  cancel(@Param('id') id: number) {
    // In a real app, check if the user has permission to cancel THIS appointment
    return this.service.cancelAppointment(+id);
  }

  // Patient views own appointments
  @Get('my-appointments')
  @Roles(UserRole.PATIENT)
  async getMyAppointments(@GetUser('sub') userId: number) {
    const patient = await this.patientsService.findByUserId(userId);
    return this.service.getPatientAppointments(patient.id);
  }

  // Doctor views appointments (slot/session wise)
  @Get('doctor-schedule')
  @Roles(UserRole.DOCTOR)
  async getDoctorSchedule(
    @GetUser('sub') userId: number,
    @Query('date') date: string,
  ) {
    const doctor = await this.doctorsService.findByUserId(userId);
    return this.service.getDoctorAppointments(doctor.id, date);
  }

  // Admin or Other views (Param based)
  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN)
  getPatientAppointments(@Param('patientId') patientId: number) {
    return this.service.getPatientAppointments(+patientId);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.ADMIN)
  getDoctorAppointments(
    @Param('doctorId') doctorId: number,
    @Query('date') date: string,
  ) {
    return this.service.getDoctorAppointments(+doctorId, date);
  }
}
