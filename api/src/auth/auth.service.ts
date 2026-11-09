import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class AuthService {
  private google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private token(u: { id: string; email: string }) {
    return this.jwt.sign({ sub: u.id, email: u.email }, { secret: process.env.JWT_SECRET, expiresIn: '30d' });
  }
  private isAdmin = (email: string) => (process.env.ADMIN_EMAILS ?? '').toLowerCase().split(',').map((x) => x.trim()).includes(email.toLowerCase());
  private async promote<T extends { id: string; email: string; role: string }>(u: T): Promise<T> {
    if (u.role !== 'ADMIN' && this.isAdmin(u.email)) return (await this.prisma.user.update({ where: { id: u.id }, data: { role: 'ADMIN' } })) as unknown as T;
    return u;
  }
  private pub(u: any) { const { passwordHash, ...rest } = u; return rest; }

  async register(email: string, password: string, name: string) {
    email = email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new BadRequestException('Email đã được sử dụng');
    const user = await this.promote(await this.prisma.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 10) } }));
    return { token: this.token(user), user: this.pub(user) };
  }

  async login(email: string, password: string) {
    const found = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!found?.passwordHash || !(await bcrypt.compare(password, found.passwordHash)))
      throw new UnauthorizedException('Sai email hoặc mật khẩu');
    const user = await this.promote(found);
    return { token: this.token(user), user: this.pub(user) };
  }

  async googleLogin(credential: string) {
    const ticket = await this.google.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    if (!p?.email || !p.sub || !p.email_verified) throw new UnauthorizedException('Google token không hợp lệ');
    let user = await this.prisma.user.findFirst({ where: { OR: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] } });
    if (!user) user = await this.prisma.user.create({ data: { email: p.email.toLowerCase(), name: p.name ?? p.email, avatar: p.picture, googleId: p.sub } });
    else if (!user.googleId) user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId: p.sub, avatar: user.avatar ?? p.picture } });
    const out = await this.promote(user);
    return { token: this.token(out), user: this.pub(out) };
  }
}
