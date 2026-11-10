import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule, PrismaService } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LettersModule } from './letters/letters.module';
import { StampsModule } from './stamps/stamps.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';

/** Sau nhiều lớp proxy (NPM → Caddy → nginx), IP thật nằm ở X-Real-IP do NPM đặt; không có thì dùng req.ip. */
class ProxyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const real = req.headers?.['x-real-ip'];
    return (typeof real === 'string' && real) || req.ip;
  }
}

@Controller('health')
class HealthController {
  constructor(private prisma: PrismaService) {}
  @Get() @SkipThrottle() async check() { await this.prisma.$queryRaw`SELECT 1`; return { ok: true }; }
}

@Module({
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ProxyThrottlerGuard }],
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 180 }]),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule, MailModule, AuthModule, UsersModule,
    LettersModule, StampsModule, OrdersModule, UploadsModule, AdminModule,
  ],
})
export class AppModule {}
