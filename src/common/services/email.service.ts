import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private client: postmark.ServerClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.postmarkApiKey');
    this.client = new postmark.ServerClient(apiKey || '');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const fromEmail = this.configService.get<string>('email.fromEmail') || 'noreply@yourdomain.com';
      
      const result = await this.client.sendEmail({
        From: fromEmail,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text || '',
        MessageStream: 'outbound',
      });

      return result.ErrorCode === 0;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendMagicLink(email: string, token: string): Promise<boolean> {
    const appUrl = this.configService.get<string>('magicLink.appUrl');
    const magicLink = `${appUrl}/auth/verify-magic-link?token=${token}&email=${encodeURIComponent(email)}`;
    
    const html = `
      <h1>Login to Your Account</h1>
      <p>Click the button below to log in to your account. This link will expire in 30 minutes.</p>
      <a href="${magicLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log In</a>
      <p>If you did not request this login link, please ignore this email.</p>
    `;

    const text = `Login to Your Account\n\nClick the link below to log in to your account. This link will expire in 30 minutes.\n\n${magicLink}\n\nIf you did not request this login link, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject: 'Login to Your Account',
      html,
      text,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const appUrl = this.configService.get<string>('magicLink.appUrl');
    const resetLink = `${appUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    const html = `
      <h1>Reset Your Password</h1>
      <p>Click the button below to reset your password. This link will expire in 30 minutes.</p>
      <a href="${resetLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      <p>If you did not request this password reset, please ignore this email.</p>
    `;

    const text = `Reset Your Password\n\nClick the link below to reset your password. This link will expire in 30 minutes.\n\n${resetLink}\n\nIf you did not request this password reset, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html,
      text,
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    const appUrl = this.configService.get<string>('magicLink.appUrl');
    const verificationLink = `${appUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    const html = `
      <h1>Verify Your Email Address</h1>
      <p>Click the button below to verify your email address. This link will expire in 30 minutes.</p>
      <a href="${verificationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      <p>If you did not create an account, please ignore this email.</p>
    `;

    const text = `Verify Your Email Address\n\nClick the link below to verify your email address. This link will expire in 30 minutes.\n\n${verificationLink}\n\nIf you did not create an account, please ignore this email.`;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
      text,
    });
  }
} 