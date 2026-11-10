import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LetterStatus, LetterType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
import { MailService } from '../mail/mail.module';
import { randomBytes } from 'crypto';
import { sanitizeDesign } from '../common/design';

@Injectable()
export class LettersService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

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
    const link = `${process.env.WEB_URL?.split(',')[0] ?? ''}/l/${l.shareToken}`;
    await this.mail.letterReceived(l.recipientEmail, l.author.name, link).catch(() => undefined);
  }

  publicFeed() {
    return this.prisma.letter.findMany({
      where: { type: LetterType.PUBLIC, status: LetterStatus.SENT, hidden: false },
      orderBy: { sentAt: 'desc' }, take: 50,
      select: { shareToken: true, title: true, envelope: true, design: true, sentAt: true, author: { select: { name: true } }, stamp: true },
    });
  }

  async viewByToken(token: string) {
    const l = await this.prisma.letter.findUnique({
      where: { shareToken: token },
      select: { shareToken: true, status: true, hidden: true, type: true, title: true, envelope: true, design: true, sentAt: true, author: { select: { name: true, avatar: true } }, stamp: true },
    });
    if (!l || l.status !== LetterStatus.SENT || l.hidden) throw new NotFoundException('Thư không tồn tại, đã bị gỡ hoặc chưa đến ngày gửi');
    return l; // không trả email người nhận / id tác giả
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
