import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    console.log('[MAIL] RESEND_API_KEY exists:', !!apiKey);
    this.resend = new Resend(apiKey);
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    console.log('[MAIL] Sending to:', email);
    const result = await this.resend.emails.send({
      from: 'NexusAid <onboarding@resend.dev>',
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
    console.log('[MAIL] Resend result:', JSON.stringify(result));
  }
}
