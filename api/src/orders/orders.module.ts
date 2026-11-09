import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Headers, HttpCode, Injectable,
  Module, NotFoundException, Param, Post, UseGuards,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { randomBytes, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';

class CreateOrderDto { @IsString() stampId: string; @IsInt() @Min(1) @Max(100) quantity: number; }

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode = () => 'HP' + Array.from(randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join('');

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  qrUrl(code: string, amount: number) {
    const { BANK_BIN, BANK_ACCOUNT, BANK_ACCOUNT_NAME } = process.env;
    const q = new URLSearchParams({ amount: String(amount), addInfo: code, accountName: BANK_ACCOUNT_NAME ?? '' });
    return `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?${q}`;
  }

  private view(o: any) {
    return {
      id: o.id, code: o.code, amount: o.amount, quantity: o.quantity, status: o.status, expiresAt: o.expiresAt,
      qrUrl: this.qrUrl(o.code, o.amount),
      bank: { bin: process.env.BANK_BIN, account: process.env.BANK_ACCOUNT, name: process.env.BANK_ACCOUNT_NAME },
    };
  }

  async create(userId: string, stampId: string, quantity: number) {
    const stamp = await this.prisma.stamp.findFirst({ where: { id: stampId, active: true } });
    if (!stamp) throw new NotFoundException('Tem không tồn tại');
    const o = await this.prisma.order.create({
      data: { code: genCode(), userId, stampId, quantity, amount: stamp.price * quantity, expiresAt: new Date(Date.now() + 15 * 60_000) },
    });
    return this.view(o);
  }

  async get(userId: string, id: string) {
    const o = await this.prisma.order.findUnique({ where: { id } });
    if (!o) throw new NotFoundException();
    if (o.userId !== userId) throw new ForbiddenException();
    return this.view(o);
  }

  /** Ghi nhận thanh toán – idempotent (providerTx unique + điều kiện status PENDING). */
  async markPaid(code: string, amount: number, providerTx: string) {
    return this.prisma.$transaction(async (tx) => {
      const o = await tx.order.findUnique({ where: { code } });
      if (!o) return 'no-order';
      if (o.status === OrderStatus.PAID) return 'duplicate';
      if (amount < o.amount) return 'underpaid';
      const r = await tx.order.updateMany({
        where: { id: o.id, status: OrderStatus.PENDING }, // vẫn nhận nếu hết hạn nhưng tiền đã vào
        data: { status: OrderStatus.PAID, paidAt: new Date(), providerTx },
      });
      if (r.count === 0) return 'duplicate';
      await tx.userStamp.upsert({
        where: { userId_stampId: { userId: o.userId, stampId: o.stampId } },
        update: { quantity: { increment: o.quantity } },
        create: { userId: o.userId, stampId: o.stampId, quantity: o.quantity },
      });
      return 'paid';
    });
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  expire() {
    return this.prisma.order.updateMany({
      where: { status: OrderStatus.PENDING, expiresAt: { lt: new Date(Date.now() - 24 * 3600_000) } },
      data: { status: OrderStatus.EXPIRED },
    });
  }
}

@Controller('orders')
class OrdersController {
  constructor(private svc: OrdersService) {}

  @Post() @UseGuards(JwtGuard)
  create(@CurrentUser() u: { sub: string }, @Body() d: CreateOrderDto) { return this.svc.create(u.sub, d.stampId, d.quantity); }

  @Get(':id') @UseGuards(JwtGuard)
  get(@CurrentUser() u: { sub: string }, @Param('id') id: string) { return this.svc.get(u.sub, id); }

  /** Chỉ dùng khi dev: giả lập thanh toán. */
  @Post(':id/mock-pay') @UseGuards(JwtGuard)
  async mock(@CurrentUser() u: { sub: string }, @Param('id') id: string) {
    if (process.env.ALLOW_MOCK_PAY !== 'true') throw new ForbiddenException();
    const o = await this.svc.get(u.sub, id);
    return { result: await this.svc.markPaid(o.code, o.amount, 'mock-' + Date.now()) };
  }

  /** SePay webhook – cấu hình header `Authorization: Apikey <SEPAY_API_KEY>` trên SePay. */
  @Post('webhook/sepay') @HttpCode(200)
  async sepay(@Headers('authorization') auth: string | undefined, @Body() b: any) {
    const expected = Buffer.from(`Apikey ${process.env.SEPAY_API_KEY ?? ''}`);
    const got = Buffer.from(auth ?? '');
    if (!process.env.SEPAY_API_KEY || got.length !== expected.length || !timingSafeEqual(got, expected))
      throw new ForbiddenException();
    if (b?.transferType !== 'in') return { success: true };
    const text = `${b.code ?? ''} ${b.content ?? ''}`.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const m = text.match(/HP[A-HJ-NP-Z2-9]{8}/);
    if (!m) throw new BadRequestException('Không tìm thấy mã đơn');
    const result = await this.svc.markPaid(m[0], Number(b.transferAmount), String(b.id));
    return { success: true, result };
  }
}

@Module({ imports: [AuthModule], controllers: [OrdersController], providers: [OrdersService], exports: [OrdersService] })
export class OrdersModule {}
