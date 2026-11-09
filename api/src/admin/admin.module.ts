import { Body, CanActivate, Controller, ExecutionContext, Get, Injectable, Module, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../common/jwt.guard';
import { OrdersModule, OrdersService } from '../orders/orders.module';

@Injectable()
class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const u = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    return u?.role === 'ADMIN';
  }
}

class StampDto {
  @IsString() name: string; @IsString() image: string; @IsOptional() @IsString() color?: string;
  @IsInt() @Min(1000) price: number; @IsOptional() @IsBoolean() active?: boolean;
}
class StampPatch {
  @IsOptional() @IsString() name?: string; @IsOptional() @IsString() image?: string; @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() @Min(1000) price?: number; @IsOptional() @IsBoolean() active?: boolean;
}

@Controller('admin')
@UseGuards(JwtGuard, AdminGuard)
class AdminController {
  constructor(private prisma: PrismaService, private orders: OrdersService) {}

  @Get('stats') async stats() {
    const [users, letters, paid] = await Promise.all([
      this.prisma.user.count(), this.prisma.letter.count({ where: { status: { not: 'DRAFT' } } }),
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: true }),
    ]);
    return { users, letters, paidOrders: paid._count, revenue: paid._sum.amount ?? 0 };
  }
  @Get('orders') orderList() { return this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { email: true } } } }); }
  /** Duyệt tay khi khách chuyển khoản nhưng webhook không khớp. */
  @Post('orders/:id/confirm') async confirm(@Param('id') id: string) {
    const o = await this.prisma.order.findUniqueOrThrow({ where: { id } });
    return { result: await this.orders.markPaid(o.code, o.amount, 'admin-' + Date.now()) };
  }
  @Get('stamps') stamps() { return this.prisma.stamp.findMany({ orderBy: { price: 'asc' } }); }
  @Post('stamps') createStamp(@Body() d: StampDto) { return this.prisma.stamp.create({ data: d }); }
  @Patch('stamps/:id') patchStamp(@Param('id') id: string, @Body() d: StampPatch) { return this.prisma.stamp.update({ where: { id }, data: d }); }
  @Get('users') users() { return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, email: true, name: true, role: true, createdAt: true } }); }
}

@Module({ imports: [AuthModule, OrdersModule], controllers: [AdminController], providers: [AdminGuard] })
export class AdminModule {}
