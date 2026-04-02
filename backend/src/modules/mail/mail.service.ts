import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const sender = this.configService.get<string>('SMTP_FROM');

    this.senderEmail = sender || 'no-reply@task-management.local';

    if (!host) {
      this.transporter = null;
      this.logger.warn(
        'SMTP_HOST is not configured. Email sending will be logged only.',
      );
      return;
    }

    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendBoardInviteEmail(params: {
    toEmail: string;
    boardName: string;
    ownerDisplayName: string;
  }) {
    const subject = `Board invite: ${params.boardName}`;
    const text = `${params.ownerDisplayName} invited you to join the board "${params.boardName}". Open your profile notifications to accept or decline the invite.`;

    await this.sendEmail({
      toEmail: params.toEmail,
      subject,
      text,
    });
  }

  async sendInviteAcceptedEmail(params: {
    toEmail: string;
    boardName: string;
    invitedUserDisplayName: string;
  }) {
    const subject = `Invite accepted: ${params.boardName}`;
    const text = `${params.invitedUserDisplayName} accepted your invitation to board "${params.boardName}".`;

    await this.sendEmail({
      toEmail: params.toEmail,
      subject,
      text,
    });
  }

  private async sendEmail(params: {
    toEmail: string;
    subject: string;
    text: string;
  }) {
    if (!this.transporter) {
      this.logger.log(
        `Email skipped (no SMTP): to=${params.toEmail}, subject=${params.subject}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.senderEmail,
      to: params.toEmail,
      subject: params.subject,
      text: params.text,
    });
  }
}
