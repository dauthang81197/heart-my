import { BadRequestException, Controller, Injectable, Logger, Module, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { AuthModule } from '../auth/auth.module';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';

const TYPES: Record<string, { ext: string; kind: 'image' | 'audio'; max: number }> = {
  'image/png': { ext: 'png', kind: 'image', max: 5 << 20 },
  'image/jpeg': { ext: 'jpg', kind: 'image', max: 5 << 20 },
  'image/webp': { ext: 'webp', kind: 'image', max: 5 << 20 },
  'image/gif': { ext: 'gif', kind: 'image', max: 5 << 20 },
  'audio/webm': { ext: 'webm', kind: 'audio', max: 10 << 20 },
  'audio/ogg': { ext: 'ogg', kind: 'audio', max: 10 << 20 },
  'audio/mp4': { ext: 'm4a', kind: 'audio', max: 10 << 20 },
  'audio/mpeg': { ext: 'mp3', kind: 'audio', max: 10 << 20 },
  'audio/wav': { ext: 'wav', kind: 'audio', max: 10 << 20 },
};

/** Lưu file lên Cloudflare R2 (S3 API). Chưa cấu hình R2 → lưu đĩa local (chỉ dùng dev). */
@Injectable()
class StorageService {
  private log = new Logger('Storage');
  private bucket = process.env.R2_BUCKET;
  private s3 = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && this.bucket
    ? new S3Client({
        region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID.trim().replace(/^https?:\/\//, '').split('.')[0]}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
      })
    : null;

  constructor() { if (!this.s3) this.log.warn('R2 chưa cấu hình – lưu file vào thư mục uploads/ (chỉ dùng khi dev)'); }

  async put(userId: string, buf: Buffer, mime: string, ext: string) {
    const key = `${userId}/${randomBytes(12).toString('hex')}.${ext}`;
    if (this.s3) {
      await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buf, ContentType: mime, CacheControl: 'public, max-age=31536000, immutable' }));
      return `${(process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')}/${key}`;
    }
    const dir = join(process.cwd(), 'uploads', userId);
    await mkdir(dir, { recursive: true });
    await writeFile(join(process.cwd(), 'uploads', key), buf);
    return `/uploads/${key}`;
  }
}

@Controller('uploads')
@UseGuards(JwtGuard)
class UploadsController {
  constructor(private storage: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 << 20 } }))
  async upload(@CurrentUser() u: { sub: string }, @UploadedFile() f: Express.Multer.File) {
    if (!f) throw new BadRequestException('Thiếu file');
    const mime = f.mimetype.split(';')[0]; // audio/webm;codecs=opus → audio/webm
    const t = TYPES[mime];
    if (!t) throw new BadRequestException('Định dạng không được hỗ trợ (ảnh png/jpg/webp/gif, âm thanh webm/ogg/m4a/mp3/wav)');
    if (f.size > t.max) throw new BadRequestException(`File quá lớn (tối đa ${t.max >> 20}MB)`);
    return { url: await this.storage.put(u.sub, f.buffer, mime, t.ext), kind: t.kind };
  }
}

@Module({ imports: [AuthModule], controllers: [UploadsController], providers: [StorageService] })
export class UploadsModule {}
