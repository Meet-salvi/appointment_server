import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserRole, AuthProvider } from '../users/users.entity';
import { Doctor } from '../doctors/doctors.entity';
import { Patient } from '../patients/patients.entity';
import { Admin } from '../admin/admin.entity';
import { SignupDto } from './dto/singup.dto';
import { SigninDto } from './dto/singin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  // ✅ SIGNUP
  async signup(dto: SignupDto) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : null;

    const user = this.userRepo.create({
      full_name: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: dto.role,
      provider: AuthProvider.LOCAL,
    });

    await this.userRepo.save(user);

    // 🔑 Role-based table entry
    if (dto.role === UserRole.DOCTOR) {
      await this.doctorRepo.save({ user });
    }
    if (dto.role === UserRole.PATIENT) {
      await this.patientRepo.save({ user });
    }
    if (dto.role === UserRole.ADMIN) {
      await this.adminRepo.save({ user });
    }

    return {
      message: 'User registered successfully',
      userId: user.id,
    };
  }

  // ✅ SIGNIN
  async signin(dto: SigninDto, res: any) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return {
      message: 'User logged in successfully',
      accessToken: token,
      role: user.role,
    };
  }

  // LOGOUT
  logout(res: any) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
