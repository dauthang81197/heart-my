import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';

function checkEnv() {
  const log = new Logger('Env');
  const need = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  const s = process.env.JWT_SECRET!;
  if (process.env.NODE_ENV === 'production') {
    if (s.length < 24 || /change-me|secret|123456/i.test(s)) log.error('JWT_SECRET yếu/mặc định! Đặt chuỗi ngẫu nhiên dài: openssl rand -hex 32');
    if (process.env.ALLOW_MOCK_PAY === 'true') log.error('ALLOW_MOCK_PAY=true trên production: ai cũng có thể giả lập thanh toán! Đặt false.');
    if (!process.env.WEB_URL) log.warn('WEB_URL chưa đặt: CORS đang mở cho mọi origin.');
    if (!process.env.SEPAY_API_KEY) log.warn('SEPAY_API_KEY chưa đặt: webhook thanh toán sẽ từ chối mọi request.');
  }
}

async function bootstrap() {
  checkEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: '3mb' }); // design có nhiều nét vẽ tay nên lớn hơn mặc định 100kb
  app.useBodyParser('urlencoded', { extended: true, limit: '1mb' });
  app.setGlobalPrefix('api');
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({ origin: process.env.WEB_URL?.split(',').map((x) => x.trim()) ?? true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
