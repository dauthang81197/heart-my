import { CanActivate, createParamDecorator, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.module';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const h: string = req.headers.authorization ?? '';
    if (!h.startsWith('Bearer ')) throw new UnauthorizedException();
    let payload: { sub: string; email: string; v?: number };
    try { payload = this.jwt.verify(h.slice(7), { secret: process.env.JWT_SECRET }); } catch { throw new UnauthorizedException(); }
    // Thu hồi token: đổi mật khẩu / xoá tài khoản làm tăng tokenVersion
    const u = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { tokenVersion: true, deletedAt: true } });
    if (!u || u.deletedAt || u.tokenVersion !== (payload.v ?? 0)) throw new UnauthorizedException();
    req.user = payload;
    return true;
  }
}
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as { sub: string; email: string });
