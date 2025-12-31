import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { Response } from 'express';

import { User, UserRole, AuthProvider } from '../users/users.entity';
import { Doctor } from '../doctors/doctors.entity';
import { Patient } from '../patients/patients.entity';
import { Admin } from '../admin/admin.entity';
import { SignupDto } from './dto/singup.dto';
import { SigninDto } from './dto/singin.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // SIGNUP
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

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = this.userRepo.create({
      full_name: dto.full_name,
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      role: dto.role,
      provider: AuthProvider.LOCAL,
      isVerified: false,
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

    // Send OTP Email
    await this.mailService.sendOtp(user.email, otp);

    return {
      message: 'Signup successful. Please verify OTP sent to your email.',
      userId: user.id,
    };
  }

  // SIGNIN
  async signin(dto: SigninDto, res: any) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
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

  // Additional methods like verifyOtp
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      return { message: 'User already verified' };
    }

    if (
      user.otp !== dto.otp ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  // RESEND OTP
  async resendOtp(dto: ResendOtpDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User already verified');
    }

    // 🔐 Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;

    await this.userRepo.save(user);

    // 📧 Send OTP again
    await this.mailService.sendOtp(user.email, otp);

    return {
      message: 'OTP resent successfully to your email',
    };
  }
}
