import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async send(payload: {
    title: string;
    message: string;
    appointmentId: number;
  }) {
    await Promise.resolve();
    console.log('NOTIFICATION:', payload);
  }
}
