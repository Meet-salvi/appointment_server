import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { ClinicsModule } from './clinics/clinics.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { MessagesModule } from './messages/messages.module';
import { DoctorAvailabilityModule } from './doctor-availability/doctor-availability.module';
import { PatientDetailsModule } from './patient-details/patient-details.module';

@Module({
  imports: [UsersModule, DoctorsModule, PatientsModule, ClinicsModule, AppointmentsModule, PaymentsModule, MessagesModule, DoctorAvailabilityModule, PatientDetailsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
