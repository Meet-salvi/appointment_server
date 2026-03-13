import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patients.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { User } from '../users/users.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Patient, User]),
        forwardRef(() => AuthModule),
    ],
    providers: [PatientsService],
    controllers: [PatientsController],
    exports: [PatientsService],
})
export class PatientsModule { }
