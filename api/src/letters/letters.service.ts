import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LetterStatus, LetterType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
import { MailService } from '../mail/mail.module';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { sanitizeDesign } from '../common/design';

@Injectable()
export class LettersService {
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(private prisma: PrismaService, private mail: MailService, private jwt: JwtService) {}

  /** d***1@gmail.com */
  static mask(email: string) {
    const [u, d] = email.split('@');
    return `${u[0] ?? ''}***${u.length > 1 ? u[u.length - 1] : ''}@${d}`;
  }
  private viewSecret = () => `${process.env.JWT_SECRET}:view`;
  private signView(letterId: string) { return this.jwt.sign({ lid: letterId }, { secret: this.viewSecret(), expiresIn: '12h' }); }
  private codeHash = (letterId: string, code: string) => createHash('sha256').update(`${letterId}:${code}`).digest('hex');

  /** Người xem hợp lệ: chính tác giả, tài khoản đã xác minh đúng email người nhận, hoặc có view-token (mã email / Google). */
  private async hasAccess(l: { id: string; authorId: string; recipientEmail: string | null }, a: { authorization?: string; viewToken?: string }) {
    if (a.viewToken) {
      try { if (this.jwt.verify(a.viewToken, { secret: this.viewSecret() }).lid === l.id) return true; } catch { /* thử cách khác */ }
    }
    if (a.authorization?.startsWith('Bearer ')) {
      try {
        const p = this.jwt.verify(a.authorization.slice(7), { secret: process.env.JWT_SECRET });
        const u = typeof p.sub === 'string' ? await this.prisma.user.findUnique({ where: { id: p.sub } }) : null;
        if (u && !u.deletedAt && u.tokenVersion === (p.v ?? 0)) {
          if (u.id === l.authorId) return true;
          if (u.emailVerified && l.recipientEmail && u.email.toLowerCase() === l.recipientEmail.toLowerCase()) return true;
        }
      } catch { /* token đăng nhập không hợp lệ */ }
    }
    return false;
  }

  private async gated(token: string) {
    const l = await this.prisma.letter.findUnique({
      where: { shareToken: token }, select: { id: true, authorId: true, status: true, hidden: true, type: true, recipientEmail: true, author: { select: { name: true } } },
    });
    if (!l || l.status !== LetterStatus.SENT || l.hidden || l.type === LetterType.PUBLIC || !l.recipientEmail) throw new NotFoundException('Thư không tồn tại hoặc không cần xác minh');
    return l as typeof l & { recipientEmail: string };
  }

  /** Gửi mã 6 số tới email người nhận (cooldown 60s). */
  async sendViewCode(token: string) {
    const l = await this.gated(token);
    const last = await this.prisma.viewCode.findFirst({ where: { letterId: l.id }, orderBy: { createdAt: 'desc' } });
    if (last && Date.now() - last.createdAt.getTime() < 60_000) throw new HttpException('Vui lòng đợi 1 phút trước khi gửi lại mã', HttpStatus.TOO_MANY_REQUESTS);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.viewCode.deleteMany({ where: { letterId: l.id } });
    await this.prisma.viewCode.create({ data: { letterId: l.id, codeHash: this.codeHash(l.id, code), expiresAt: new Date(Date.now() + 10 * 60_000) } });
    await this.mail.letterCode(l.recipientEmail, code, l.author.name).catch(() => undefined);
    return { ok: true, maskedEmail: LettersService.mask(l.recipientEmail) };
  }

  async verifyViewCode(token: string, code: string) {
    const l = await this.gated(token);
    const row = await this.prisma.viewCode.findFirst({ where: { letterId: l.id }, orderBy: { createdAt: 'desc' } });
    if (!row || row.expiresAt < new Date()) throw new BadRequestException('Mã đã hết hạn, hãy gửi mã mới');
    if (row.attempts >= 5) throw new HttpException('Nhập sai quá nhiều lần, hãy gửi mã mới', HttpStatus.TOO_MANY_REQUESTS);
    const a = Buffer.from(this.codeHash(l.id, code.trim())), b = Buffer.from(row.codeHash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await this.prisma.viewCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException('Mã không đúng');
    }
    await this.prisma.viewCode.deleteMany({ where: { letterId: l.id } });
    return { viewToken: this.signView(l.id) };
  }

  async viewWithGoogle(token: string, credential: string) {
    const l = await this.gated(token);
    let p;
    try { p = (await this.google.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID })).getPayload(); } catch { throw new BadRequestException('Google token không hợp lệ'); }
    if (!p?.email || !p.email_verified) throw new BadRequestException('Google token không hợp lệ');
    if (p.email.toLowerCase() !== l.recipientEmail.toLowerCase()) throw new ForbiddenException(`Thư này gửi cho ${LettersService.mask(l.recipientEmail)}. Hãy dùng đúng tài khoản Google đó.`);
    return { viewToken: this.signView(l.id) };
  }

  private async own(userId: string, id: string) {
    const l = await this.prisma.letter.findUnique({ where: { id } });
    if (!l) throw new NotFoundException();
    if (l.authorId !== userId) throw new ForbiddenException();
    return l;
  }

  create(userId: string, type: LetterType) {
    return this.prisma.letter.create({ data: { authorId: userId, type, shareToken: randomBytes(16).toString('hex') } });
  }

  list(userId: string) {
    return this.prisma.letter.findMany({
      where: { authorId: userId }, orderBy: { updatedAt: 'desc' }, include: { stamp: true },
    });
  }

  /** Chỉ tài khoản đã xác minh email (đăng nhập Google) mới xem được hộp thư nhận, tránh đăng ký bằng email người khác để đọc thư. */
  async inbox(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u?.emailVerified) return [];
    return this.prisma.letter.findMany({
      where: { recipientEmail: u.email.toLowerCase(), status: LetterStatus.SENT },
      orderBy: { sentAt: 'desc' }, include: { author: { select: { name: true, avatar: true } }, stamp: true },
    });
  }

  get(userId: string, id: string) { return this.own(userId, id); }

  async update(userId: string, id: string, data: Prisma.LetterUncheckedUpdateInput) {
    const l = await this.own(userId, id);
    if (l.status !== LetterStatus.DRAFT) throw new BadRequestException('Thư đã gửi, không thể sửa');
    if (data.design && typeof data.design === 'object') data = { ...data, design: sanitizeDesign(data.design as Record<string, any>) as Prisma.InputJsonValue };
    return this.prisma.letter.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    await this.own(userId, id);
    await this.prisma.letter.delete({ where: { id } });
    return { ok: true };
  }

  /** Gửi thư: bắt buộc có tem, trừ 1 tem trong kho (atomic). */
  async send(userId: string, id: string, stampId: string) {
    const l = await this.own(userId, id);
    if (l.status !== LetterStatus.DRAFT) throw new BadRequestException('Thư đã được gửi');
    if (l.type === LetterType.PRIVATE && !l.recipientEmail) throw new BadRequestException('Thiếu email người nhận');
    if (l.type === LetterType.FUTURE) {
      if (!l.recipientEmail) throw new BadRequestException('Thiếu email người nhận');
      if (!l.deliverAt || l.deliverAt.getTime() < Date.now() + 60_000) throw new BadRequestException('Ngày gửi phải ở tương lai');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      // Chốt trạng thái trước (chống bấm gửi 2 lần cùng lúc làm trừ tem hai lần)
      const lock = await tx.letter.updateMany({ where: { id, status: LetterStatus.DRAFT }, data: { updatedAt: new Date() } });
      if (lock.count === 0) throw new BadRequestException('Thư đã được gửi');
      const r = await tx.userStamp.updateMany({
        where: { userId, stampId, quantity: { gt: 0 } }, data: { quantity: { decrement: 1 } },
      });
      if (r.count === 0) throw new BadRequestException('Bạn chưa có tem này. Hãy mua tem trước khi gửi.');
      return tx.letter.update({
        where: { id },
        data: {
          stampId,
          status: l.type === LetterType.FUTURE ? LetterStatus.SCHEDULED : LetterStatus.SENT,
          sentAt: l.type === LetterType.FUTURE ? null : new Date(),
        },
      });
    });
    if (updated.status === LetterStatus.SENT) await this.notify(updated.id);
    return updated;
  }

  private async notify(id: string) {
    const l = await this.prisma.letter.findUnique({ where: { id }, include: { author: true } });
    if (!l?.recipientEmail) return;
    const link = `${(process.env.WEB_URL?.split(',')[0] ?? '').trim().replace(/\/$/, '')}/l/${l.shareToken}`;
    await this.mail.letterReceived(l.recipientEmail, l.recipientName, l.author.name, link).catch(() => undefined);
  }

  publicFeed() {
    return this.prisma.letter.findMany({
      where: { type: LetterType.PUBLIC, status: LetterStatus.SENT, hidden: false },
      orderBy: { sentAt: 'desc' }, take: 50,
      select: { shareToken: true, title: true, envelope: true, design: true, sentAt: true, author: { select: { name: true } }, stamp: true },
    });
  }

  async viewByToken(token: string, access: { authorization?: string; viewToken?: string } = {}) {
    const l = await this.prisma.letter.findUnique({
      where: { shareToken: token },
      select: { id: true, authorId: true, recipientEmail: true, shareToken: true, status: true, hidden: true, type: true, title: true, envelope: true, design: true, sentAt: true, author: { select: { name: true, avatar: true } }, stamp: true },
    });
    if (!l || l.status !== LetterStatus.SENT || l.hidden) throw new NotFoundException('Thư không tồn tại, đã bị gỡ hoặc chưa đến ngày gửi');
    // Thư riêng tư / hẹn giờ: phải xác minh là đúng người nhận
    if (l.type !== LetterType.PUBLIC && l.recipientEmail && !(await this.hasAccess(l, access))) {
      throw new ForbiddenException({ locked: true, maskedEmail: LettersService.mask(l.recipientEmail), authorName: l.author.name, message: 'Lá thư riêng tư' });
    }
    const { id, authorId, recipientEmail, ...pub } = l; // không trả email người nhận / id
    return pub;
  }

  /** Báo cáo thư vi phạm. Mỗi người báo cáo 1 lần/thư; đủ REPORT_AUTO_HIDE người khác nhau thì tự ẩn chờ quản trị viên xem. */
  async report(token: string, reason: string, note: string | undefined, reporterKey: string) {
    const l = await this.prisma.letter.findUnique({ where: { shareToken: token }, select: { id: true, status: true } });
    if (!l || l.status !== LetterStatus.SENT) throw new NotFoundException('Thư không tồn tại');
    await this.prisma.report.upsert({
      where: { letterId_reporterKey: { letterId: l.id, reporterKey } },
      update: { reason, note: note?.slice(0, 500) }, create: { letterId: l.id, reason, note: note?.slice(0, 500), reporterKey },
    });
    const open = await this.prisma.report.count({ where: { letterId: l.id, status: 'OPEN' } });
    if (open >= Number(process.env.REPORT_AUTO_HIDE ?? 3)) await this.prisma.letter.update({ where: { id: l.id }, data: { hidden: true } });
    return { ok: true };
  }

  /** Mỗi phút: giao các thư hẹn giờ đã đến hạn. */
  @Cron(CronExpression.EVERY_MINUTE)
  async deliverScheduled() {
    const due = await this.prisma.letter.findMany({
      where: { status: LetterStatus.SCHEDULED, deliverAt: { lte: new Date() } }, select: { id: true },
    });
    for (const { id } of due) {
      const r = await this.prisma.letter.updateMany({
        where: { id, status: LetterStatus.SCHEDULED }, data: { status: LetterStatus.SENT, sentAt: new Date() },
      });
      if (r.count) await this.notify(id);
    }
  }
}
