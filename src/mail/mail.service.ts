import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_PASS');
    if (!user || !pass) {
      throw new Error('MAIL_USER and MAIL_PASS are required');
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: Number(this.config.get<string>('MAIL_PORT') || 465),
      secure:
        String(this.config.get<string>('MAIL_SECURE') || 'true') === 'true',
      auth: {
        user,
        pass,
      },
    });
  }

async sendVerificationEmail(
    toEmail: string,
    name: string,
    code: string,
  ): Promise<void> {

    try {
      const info = await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_FROM') || this.config.get('MAIL_USER'),
        to: toEmail,
        subject: 'Your verification code',
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing:5px;">${code}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });
      this.logger.log(`Email sent successfully: ${info.response}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${toEmail}`, err);
    }
  }
}
