import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM', 'Blogie <noreply@blogie.com>'),
      to,
      subject: 'Xác thực email - Mã OTP của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác thực email của bạn</h2>
          <p>Mã OTP của bạn là:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
            ${otp}
          </div>
          <p style="color: #666; margin-top: 20px;">Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendResetPasswordOtpEmail(to: string, otp: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM', 'Blogie <noreply@blogie.com>'),
      to,
      subject: 'Đặt lại mật khẩu - Mã OTP của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
            ${otp}
          </div>
          <p style="color: #666; margin-top: 20px;">Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
