import { Global, Injectable, Logger, Module } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private log = new Logger('Mail');
  private tx = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      })
    : null;

  async send(to: string, subject: string, html: string) {
    if (!this.tx) { this.log.warn(`SMTP chưa cấu hình, bỏ qua mail tới ${to}: ${subject}`); return; }
    await this.tx.sendMail({ from: process.env.MAIL_FROM ?? 'HeartPost <no-reply@heartpost.local>', to, subject, html });
  }

  letterReceived(to: string, from: string, link: string) {
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const name = esc(from).slice(0, 80);
    return this.send(to, `${from.replace(/[\r\n]/g, ' ').slice(0, 80)} đã gửi bạn một lá thư`,
      `<div style="font-family:sans-serif"><h2>Bạn có một lá thư từ ${name}</h2><p><a href="${esc(link)}">Mở phong bì</a></p></div>`);
  }
}
@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
