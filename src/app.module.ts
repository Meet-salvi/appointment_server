import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { SpecializationModule } from './specialization/specialization.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // PostgreSQL + TypeORM configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eUEsyHqax2R7@ep-square-dream-a1owbpb1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
      autoLoadEntities: true,
      synchronize: true, // set false in production
      ssl: {
        rejectUnauthorized: false,
      },
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
    AdminModule,
    AuthModule,
    MailModule,
    SpecializationModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
