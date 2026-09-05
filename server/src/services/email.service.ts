import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface IEmailProvider {
  sendOtpEmail(email: string, name: string, otp: string): Promise<void>;
  sendVerificationEmail(email: string, name: string, token: string): Promise<void>;
  sendGDApprovalEmail(email: string, name: string, topic: string, date: string, time: string, meetingLink: string): Promise<void>;
  sendGDRejectionEmail(email: string, name: string, topic: string, reason: string): Promise<void>;
}

const getOtpEmailHtml = (name: string, otp: string) => `
  <div style="font-family:'Inter',Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#fff;">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 20px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">MockMate<span style="color:#93c5fd;">.AI</span></h1>
      <p style="color:#c4b5fd;margin:6px 0 0;font-size:13px;">AI-Powered Interview Preparation</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:700;">Hello ${name},</h2>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin-bottom:24px;">Welcome to MockMate.AI. Use the verification code below to activate your account.</p>
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;background:#f1f5f9;border:2px solid #2563eb;border-radius:12px;padding:18px 40px;">
          <p style="margin:0;font-size:13px;color:#64748b;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Your Verification Code</p>
          <p style="margin:10px 0 0;font-size:42px;font-weight:800;letter-spacing:10px;color:#1e293b;font-family:monospace;">${otp}</p>
        </div>
      </div>
      <p style="color:#64748b;font-size:14px;text-align:center;margin-top:0;">This verification code is valid for <strong>10 minutes</strong>.</p>
      <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">If you did not create this account, please ignore this email. No action is required.</p>
        <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;line-height:1.6;">Thank you,<br/>MockMate.AI Team</p>
      </div>
    </div>
  </div>
`;

class ResendProvider implements IEmailProvider {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'your_resend_api_key_here') {
      console.error('[EMAIL - RESEND] ❌ Missing or invalid RESEND_API_KEY in environment variables.');
      throw new Error('Resend API key missing. Check environment variables.');
    }
    this.resend = new Resend(apiKey);
  }

  private handleError(error: any): never {
    const message = error?.message || '';
    if (message.includes('can only send testing emails to your own email address')) {
      throw new Error('Email service is currently in testing mode. Please verify your sending domain or configure a production email provider.');
    }
    throw new Error(`Unable to send email via Resend: ${message}`);
  }

  public async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    console.log(`[EMAIL - RESEND] 🚀 Sending OTP to ${email}`);
    const { error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [email],
      subject: 'Verify Your MockMate.AI Account',
      html: getOtpEmailHtml(name, otp),
    });

    if (error) this.handleError(error);
  }

  public async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/verify-email?token=${token}`;
    const { error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [email],
      subject: '✅ Verify your MockMate.AI Account',
      html: `<p>Verify your account: <a href="${link}">${link}</a></p>`,
    });

    if (error) this.handleError(error);
  }

  public async sendGDApprovalEmail(email: string, name: string, topic: string, date: string, time: string, meetingLink: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [email],
      subject: 'Your Live GD Request is Approved! - MockMate.AI',
      html: `<p>Hi ${name}, your GD request for ${topic} is approved. Join here: <a href="${meetingLink}">Join</a></p>`,
    });

    if (error) this.handleError(error);
  }

  public async sendGDRejectionEmail(email: string, name: string, topic: string, reason: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [email],
      subject: 'Update on your Live GD Request - MockMate.AI',
      html: `<p>Hi ${name}, your GD request for ${topic} was rejected. Reason: ${reason}</p>`,
    });

    if (error) this.handleError(error);
  }
}

class SmtpProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async ensureConnection(): Promise<void> {
    try {
      await this.transporter.verify();
    } catch (error) {
      console.error('[EMAIL - SMTP] ❌ Connection verification failed:', error);
      throw new Error('Email service configuration error. Please contact support.');
    }
  }

  public async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    console.log(`[EMAIL - SMTP] 🚀 Sending OTP to ${email}`);
    await this.ensureConnection();
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@mockmate.ai',
        to: email,
        subject: `Your MockMate.AI Code: ${otp}`,
        text: `Hello ${name},\n\nYour MockMate.AI verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nThank you,\nMockMate.AI Team`,
      });
      console.log(`[EMAIL - SMTP] ✅ OTP email sent to ${email}`);
    } catch (error) {
      console.error('[EMAIL - SMTP] ❌ Failed to send OTP email:', error);
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }

  public async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/verify-email?token=${token}`;
    await this.ensureConnection();
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@mockmate.ai',
        to: email,
        subject: '✅ Verify your MockMate.AI Account',
        html: `<p>Verify your account: <a href="${link}">${link}</a></p>`,
      });
    } catch (error) {
      console.error('[EMAIL - SMTP] ❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }

  public async sendGDApprovalEmail(email: string, name: string, topic: string, date: string, time: string, meetingLink: string): Promise<void> {
    await this.ensureConnection();
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@mockmate.ai',
        to: email,
        subject: 'Your Live GD Request is Approved! - MockMate.AI',
        html: `<p>Hi ${name}, your GD request for ${topic} is approved. Join here: <a href="${meetingLink}">Join</a></p>`,
      });
    } catch (error) {
      console.error('[EMAIL - SMTP] ❌ Failed to send GD approval email:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  public async sendGDRejectionEmail(email: string, name: string, topic: string, reason: string): Promise<void> {
    await this.ensureConnection();
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@mockmate.ai',
        to: email,
        subject: 'Update on your Live GD Request - MockMate.AI',
        html: `<p>Hi ${name}, your GD request for ${topic} was rejected. Reason: ${reason}</p>`,
      });
    } catch (error) {
      console.error('[EMAIL - SMTP] ❌ Failed to send GD rejection email:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }
}

class EmailService implements IEmailProvider {
  private provider: IEmailProvider;

  constructor() {
    // Factory: Decide which provider to use based on EMAIL_PROVIDER env variable
    if (process.env.EMAIL_PROVIDER === 'smtp') {
      console.log('[EMAIL] Using SMTP Provider (Nodemailer)');
      this.provider = new SmtpProvider();
    } else {
      console.log('[EMAIL] Using Resend API Provider');
      this.provider = new ResendProvider();
    }
  }

  public async sendOtpEmail(email: string, name: string, otp: string): Promise<void> {
    return this.provider.sendOtpEmail(email, name, otp);
  }

  public async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    return this.provider.sendVerificationEmail(email, name, token);
  }

  public async sendGDApprovalEmail(email: string, name: string, topic: string, date: string, time: string, meetingLink: string): Promise<void> {
    return this.provider.sendGDApprovalEmail(email, name, topic, date, time, meetingLink);
  }

  public async sendGDRejectionEmail(email: string, name: string, topic: string, reason: string): Promise<void> {
    return this.provider.sendGDRejectionEmail(email, name, topic, reason);
  }
}

export const emailService = new EmailService();
