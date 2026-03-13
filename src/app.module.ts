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
      envFilePath: '.env',
    }),

    // PostgreSQL + TypeORM configuration
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        console.log('DEBUG: Connecting to database host:', configService.get('DB_HOST'));
        return {
          type: 'postgres',
          url: url,
          autoLoadEntities: true,
          synchronize: true, // set false in production
          ssl: {
            rejectUnauthorized: false,
          },
        };
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
