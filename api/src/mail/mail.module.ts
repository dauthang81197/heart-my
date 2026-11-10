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
    await this.tx.sendMail({ from: process.env.MAIL_FROM ?? 'TrueNote <no-reply@truenote.online>', to, subject, html });
  }

  verifyEmail(to: string, link: string) {
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    return this.send(to, 'Xác minh email TrueNote', `<div style="font-family:sans-serif"><h2>Xác minh email</h2><p>Bấm để xác minh email của bạn (hiệu lực 24 giờ):</p><p><a href="${esc(link)}">Xác minh email</a></p></div>`);
  }

  resetPassword(to: string, link: string) {
    const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    return this.send(to, 'Đặt lại mật khẩu TrueNote', `<div style="font-family:sans-serif"><h2>Đặt lại mật khẩu</h2><p>Bấm vào liên kết dưới đây trong vòng 30 phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p><p><a href="${esc(link)}">Đặt lại mật khẩu</a></p></div>`);
  }

  private esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

  /** Email báo có thư mới (thư riêng tư: người nhận phải xác minh email trước khi mở). */
  letterReceived(to: string, recipientName: string | null | undefined, from: string, link: string) {
    const e = this.esc, A = e(from).slice(0, 80), R = e((recipientName || to.split('@')[0]).slice(0, 80)), email = e(to);
    const support = process.env.SUPPORT_EMAIL ?? 'hello@truenote.online';
    const p = 'margin:0 0 14px;font-size:16px;line-height:1.55;color:#222';
    const html = `<!doctype html><html><body style="margin:0;background:#f4f3ef;font-family:Roboto,Segoe UI,Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;padding:0 12px">
<div style="background:#fff;border:1px solid #e8e6df;border-radius:18px;padding:30px 30px 26px">
<p style="${p}">${R} ơi,</p>
<p style="${p}">Có vài điều ${A} muốn nói với ${R}.</p>
<p style="${p}">${A} có một lá thư muốn gửi cho ${R}.</p>
<p style="${p};margin-top:22px">Tự tay viết.<br>Tự tay gửi.<br>Và tất nhiên là không thể gửi cho ai khác =)))</p>
<p style="margin:0 0 22px;font-size:13px;color:#555">Thư gửi từ <b>${A}</b> qua TrueNote.</p>
<a href="${e(link)}" style="display:inline-block;background:#3a4a5a;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:10px">Mở thư</a>
<p style="margin:12px 0 18px;font-size:12px;color:#777">Hoặc mở đường dẫn: <a href="${e(link)}" style="color:#3a4a5a;word-break:break-all">${e(link)}</a></p>
<p style="margin:0 0 14px;font-size:14px;color:#333;font-style:italic">Psst... mở đi, ${A} có chuyện muốn nói.</p>
<p style="margin:0;font-size:12.5px;line-height:1.6;color:#555">Thư này chỉ dành riêng cho bạn: trước khi mở, bạn xác minh địa chỉ <a href="mailto:${email}" style="color:#1a0dab">${email}</a> bằng Google hoặc một mã gửi tới hộp thư này, không cần tạo tài khoản.</p>
</div>
<p style="margin:16px 6px 6px;font-size:11.5px;line-height:1.6;color:#777">Bạn nhận được email này vì ${A} đã nhập địa chỉ <a href="mailto:${email}" style="color:#1a0dab">${email}</a> khi gửi thư qua TrueNote. Đây là thông báo một lần cho lá thư này, không phải email quảng cáo. Nếu bạn không quen người gửi, có thể bỏ qua email.</p>
<p style="margin:0 6px;font-size:11.5px;color:#777">Đây là email tự động, vui lòng không trả lời. Cần hỗ trợ, hãy liên hệ tại <a href="mailto:${e(support)}" style="color:#555">${e(support)}</a>.</p>
</div></body></html>`;
    return this.send(to, `${from.replace(/[\r\n]/g, ' ').slice(0, 80)} có một lá thư gửi cho bạn`, html);
  }

  /** Mã xác minh 6 số để mở thư riêng tư. */
  letterCode(to: string, code: string, from: string) {
    const e = this.esc;
    return this.send(to, `Mã mở thư của bạn: ${code}`,
      `<div style="font-family:Roboto,Segoe UI,Arial,sans-serif;max-width:480px;margin:20px auto;padding:26px;border:1px solid #e8e6df;border-radius:16px;background:#fff"><p style="font-size:15px;color:#222;margin:0 0 14px">Mã xác minh để mở lá thư của <b>${e(from).slice(0, 80)}</b>:</p><div style="font-size:34px;letter-spacing:8px;font-weight:700;color:#3a4a5a;margin:10px 0 16px">${e(code)}</div><p style="font-size:12.5px;color:#666;margin:0">Mã có hiệu lực 10 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này, không ai mở được thư nếu không có mã.</p></div>`);
  }
}
@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
