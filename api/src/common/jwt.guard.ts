import { CanActivate, createParamDecorator, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const h: string = req.headers.authorization ?? '';
    if (!h.startsWith('Bearer ')) throw new UnauthorizedException();
    try {
      req.user = this.jwt.verify(h.slice(7), { secret: process.env.JWT_SECRET });
      return true;
    } catch { throw new UnauthorizedException(); }
  }
}
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as { sub: string; email: string });
