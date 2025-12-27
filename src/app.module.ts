import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // PostgreSQL + TypeORM configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(<string>process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, //set false in production
    }),

    UsersModule,
    DoctorsModule,
    PatientsModule,
    ClinicsModule,
    AppointmentsModule,
    PaymentsModule,
    MessagesModule,
    DoctorAvailabilityModule,
    PatientDetailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
