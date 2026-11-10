import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.module';
import { MailService } from '../mail/mail.module';

@Injectable()
export class AuthService {
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(private prisma: PrismaService, private jwt: JwtService, private mail: MailService) {}

  private token(u: { id: string; email: string; tokenVersion?: number }) {
    return this.jwt.sign({ sub: u.id, email: u.email, v: u.tokenVersion ?? 0 }, { secret: process.env.JWT_SECRET, expiresIn: '30d' });
  }
  private isAdmin = (email: string) => (process.env.ADMIN_EMAILS ?? '').toLowerCase().split(',').map((x) => x.trim()).includes(email.toLowerCase());
  /** Chỉ nâng quyền admin cho email ĐÃ XÁC MINH (Google), tránh đăng ký trước bằng email admin. */
  private async promote<T extends { id: string; email: string; role: string; emailVerified: boolean }>(u: T): Promise<T> {
    if (u.role !== 'ADMIN' && u.emailVerified && this.isAdmin(u.email)) return (await this.prisma.user.update({ where: { id: u.id }, data: { role: 'ADMIN' } })) as unknown as T;
    return u;
  }
  private pub(u: any) { const { passwordHash, ...rest } = u; return rest; }

  private base = () => (process.env.WEB_URL?.split(',')[0] ?? '').trim().replace(/\/$/, '');
  private hash = (t: string) => createHash('sha256').update(t).digest('hex');
  /** Tạo token dùng 1 lần; trả về token thô (chỉ gửi qua email). */
  private async issue(userId: string, type: 'VERIFY' | 'RESET', ttlMs: number) {
    const raw = randomBytes(32).toString('hex');
    await this.prisma.authToken.deleteMany({ where: { userId, type } }); // chỉ giữ token mới nhất
    await this.prisma.authToken.create({ data: { userId, type, tokenHash: this.hash(raw), expiresAt: new Date(Date.now() + ttlMs) } });
    return raw;
  }
  private async consume(raw: string, type: 'VERIFY' | 'RESET') {
    const t = await this.prisma.authToken.findUnique({ where: { tokenHash: this.hash(raw) } });
    if (!t || t.type !== type || t.usedAt || t.expiresAt < new Date()) throw new BadRequestException('Liên kết không hợp lệ hoặc đã hết hạn');
    const r = await this.prisma.authToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: new Date() } });
    if (r.count === 0) throw new BadRequestException('Liên kết không hợp lệ hoặc đã hết hạn');
    return t.userId;
  }

  async sendVerification(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!u || u.emailVerified) return { ok: true };
    const raw = await this.issue(u.id, 'VERIFY', 24 * 3600_000);
    await this.mail.verifyEmail(u.email, `${this.base()}/verify?token=${raw}`).catch(() => undefined);
    return { ok: true };
  }

  async verify(raw: string) {
    const userId = await this.consume(raw, 'VERIFY');
    let u = await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    u = await this.promote(u);
    return { ok: true, role: u.role };
  }

  /** Luôn trả ok để không lộ email nào đã đăng ký. */
  async forgot(email: string) {
    const u = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (u && !u.deletedAt) {
      const raw = await this.issue(u.id, 'RESET', 30 * 60_000);
      await this.mail.resetPassword(u.email, `${this.base()}/reset?token=${raw}`).catch(() => undefined);
    }
    return { ok: true };
  }

  async reset(raw: string, password: string) {
    const userId = await this.consume(raw, 'RESET');
    // Nhận được email đặt lại = chứng minh sở hữu email → coi là đã xác minh; tăng tokenVersion để đăng xuất mọi thiết bị
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 10), emailVerified: true, tokenVersion: { increment: 1 } } });
    return { ok: true };
  }

  async register(email: string, password: string, name: string) {
    email = email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new BadRequestException('Email đã được sử dụng');
    const user = await this.prisma.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 10) } });
    this.sendVerification(user.id).catch(() => undefined);
    return { token: this.token(user), user: this.pub(user) };
  }

  async login(email: string, password: string) {
    const found = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (found?.deletedAt || !found?.passwordHash || !(await bcrypt.compare(password, found.passwordHash)))
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    const user = await this.promote(found);
    return { token: this.token(user), user: this.pub(user) };
  }

  async googleLogin(credential: string) {
    const ticket = await this.google.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p?.email || !p.sub || !p.email_verified) throw new UnauthorizedException('Google token không hợp lệ');
    let user = await this.prisma.user.findFirst({ where: { OR: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] } });
    if (!user) user = await this.prisma.user.create({ data: { email: p.email.toLowerCase(), name: p.name ?? p.email, avatar: p.picture, googleId: p.sub, emailVerified: true } });
    else if (!user.googleId || !user.emailVerified) {
      // Email đã được Google xác minh. Nếu tài khoản này tạo bằng mật khẩu khi CHƯA xác minh, mật khẩu đó có thể do người lạ đặt → huỷ.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: p.sub, emailVerified: true, avatar: user.avatar ?? p.picture, ...(user.emailVerified ? {} : { passwordHash: null }) },
      });
    }
    const out = await this.promote(user);
    return { token: this.token(out), user: this.pub(out) };
  }
}
