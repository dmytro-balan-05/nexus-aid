import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private config: ConfigService) {}

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>('BREVO_API_KEY');

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'NexusAid', email: 'bdmytro05@gmail.com' },
        to: [{ email }],
        subject: 'Код підтвердження NexusAid',
        htmlContent: `
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
      }),
    });

    const result = (await res.json()) as any;
    if (!res.ok) {
      console.error('[MAIL] Brevo error:', JSON.stringify(result));
    } else {
      console.log('[MAIL] Sent successfully to:', email);
    }
  }
}
