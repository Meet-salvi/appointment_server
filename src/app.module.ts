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
      envFilePath: ['.env', 'server/.env'],
    }),

    // PostgreSQL + TypeORM configuration
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        const host = configService.get<string>('DB_HOST') || process.env.DB_HOST;
        
        console.log('--- DATABASE CONFIG DEBUG ---');
        console.log('DB_HOST:', host);
        console.log('DATABASE_URL length:', url?.length || 0);
        console.log('PROCESS_ENV_URL length:', process.env.DATABASE_URL?.length || 0);
        
        if (!url) {
          throw new Error('DATABASE_URL is not defined in .env! Please check your configuration.');
        }

        return {
          type: 'postgres',
          url: url,
          autoLoadEntities: true,
          synchronize: true,
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
