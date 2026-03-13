import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      console.log('✅ Mail server connection established');
    } catch (error) {
      console.error('❌ Mail server connection failed:', error.message);
      console.error('Please check your MAIL_USER and MAIL_PASS (App Password) in .env');
    }
  }

  async sendOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_USER'),
      to: email,
      subject: '🔐 Email Verification OTP - Schedula',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#0F131A;color:#fff;border-radius:16px;">
          <h2 style="color:#14b8a6;margin-bottom:10px;">Verify Your Email</h2>
          <p style="color:#94a3b8;">Your one-time password is:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;text-align:center;padding:20px;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.3);border-radius:12px;margin:20px 0;color:#14b8a6;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border-color:rgba(255,255,255,0.1);margin:20px 0;">
          <p style="color:#475569;font-size:11px;text-align:center;">© 2026 Schedula Technologies</p>
        </div>
      `,
    });
  }

  async sendAppointmentNotification(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    date: string,
    startTime: string,
    endTime: string,
    tokenNumber: number,
  ) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_USER'),
      to: doctorEmail,
      subject: `📅 New Appointment Booked - ${patientName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#0F131A;color:#fff;border-radius:16px;">
          <h2 style="color:#14b8a6;margin-bottom:5px;">New Appointment Booked</h2>
          <p style="color:#94a3b8;">Hello Dr. ${doctorName},</p>
          <p style="color:#cbd5e1;">A new appointment has been booked with the following details:</p>
          <div style="background:rgba(20,184,166,0.08);border:1px solid rgba(20,184,166,0.2);border-radius:12px;padding:20px;margin:20px 0;">
            <table style="width:100%;color:#e2e8f0;font-size:14px;">
              <tr><td style="padding:6px 0;color:#64748b;">Patient</td><td style="font-weight:700;">${patientName}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Date</td><td style="font-weight:700;">${date}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Time</td><td style="font-weight:700;">${startTime} - ${endTime}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;">Token</td><td style="font-weight:700;color:#14b8a6;">#${tokenNumber}</td></tr>
            </table>
          </div>
          <hr style="border-color:rgba(255,255,255,0.1);margin:20px 0;">
          <p style="color:#475569;font-size:11px;text-align:center;">© 2026 Schedula Technologies</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(email: string, otp: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_USER'),
      to: email,
      subject: '🔑 Password Reset OTP - Schedula',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:30px;background:#0F131A;color:#fff;border-radius:16px;">
          <h2 style="color:#14b8a6;margin-bottom:10px;">Reset Your Password</h2>
          <p style="color:#94a3b8;">You've requested a password reset. Use the code below:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:8px;text-align:center;padding:20px;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.3);border-radius:12px;margin:20px 0;color:#14b8a6;">
            ${otp}
          </div>
          <p style="color:#64748b;font-size:13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
          <hr style="border-color:rgba(255,255,255,0.1);margin:20px 0;">
          <p style="color:#475569;font-size:11px;text-align:center;">© 2026 Schedula Technologies</p>
        </div>
      `,
    });
  }
}
