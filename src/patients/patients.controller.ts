import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    @Get('me')
    @Roles(UserRole.PATIENT)
    getProfile(@GetUser('sub') userId: number) {
        return this.patientsService.getProfile(userId);
    }

    @Patch('me')
    @Roles(UserRole.PATIENT)
    updateProfile(@GetUser('sub') userId: number, @Body() updateData: any) {
        return this.patientsService.updateProfile(userId, updateData);
    }
}
