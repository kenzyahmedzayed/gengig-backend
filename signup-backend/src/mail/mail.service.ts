import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'gengig2025@gmail.com',
    pass: 'giagkhuqbltzljrw',
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
  from: 'gengig2025@gmail.com',
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
  console.log('Email sent successfully:', info.response);
} catch (err) {
  console.log('MAIL_USER:', this.config.get('MAIL_USER'));
  console.log('MAIL_PASS:', this.config.get('MAIL_PASS'));
  this.logger.error(`Failed to send email to ${toEmail}`, err);
}
  }
}