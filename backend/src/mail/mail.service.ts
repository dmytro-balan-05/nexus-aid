import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: this.config.get<string>('GMAIL_USER'),
        pass: this.config.get<string>('GMAIL_APP_PASSWORD'),
      },
      tls: { rejectUnauthorized: false },
    } as any);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"NexusAid" <${this.config.get<string>('GMAIL_USER')}>`,
      to: email,
      subject: 'Код підтвердження NexusAid',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;">
          <h2 style="color:#111827;margin-bottom:8px;">Підтвердження реєстрації</h2>
          <p style="color:#6b7280;margin-bottom:24px;">Введіть цей код на сайті NexusAid:</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:12px;text-align:center;
                      padding:24px;background:#f3f4f6;border-radius:12px;margin-bottom:24px;
                      color:#111827;">
            ${code}
          </div>
          <p style="color:#9ca3af;font-size:13px;">Код дійсний 15 хвилин.</p>
        </div>
      `,
    });
  }
}