import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsDateString, IsEmail, IsEnum, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { LetterType } from '@prisma/client';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';
import { PrismaService } from '../prisma/prisma.module';
import { LettersService } from './letters.service';

class CreateDto { @IsEnum(LetterType) type: LetterType; }
class UpdateDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(80) recipientName?: string;
  @IsOptional() @IsEmail() recipientEmail?: string;
  @IsOptional() @IsDateString() deliverAt?: string;
  @IsOptional() @IsString() @MaxLength(40) envelope?: string;
  @IsOptional() @IsObject() design?: Record<string, any>;
}
class ReportDto { @IsIn(['SPAM', 'ABUSE', 'ADULT', 'COPYRIGHT', 'OTHER']) reason: string; @IsOptional() @IsString() @MaxLength(500) note?: string; }
class CodeDto { @IsString() @MaxLength(10) code: string; }
class GoogleViewDto { @IsString() credential: string; }
class SendDto { @IsString() stampId: string; }

@Controller('letters')
export class LettersController {
  constructor(private svc: LettersService, private prisma: PrismaService) {}

  // --- public (khai báo trước :id) ---
  @Get('public/feed') feed() { return this.svc.publicFeed(); }
  @Get('view/:token') view(@Param('token') t: string, @Headers('authorization') auth?: string, @Headers('x-view-token') vt?: string) { return this.svc.viewByToken(t, { authorization: auth, viewToken: vt }); }
  @Post('view/:token/code') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } }) sendCode(@Param('token') t: string) { return this.svc.sendViewCode(t); }
  @Post('view/:token/verify') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60_000 } }) verifyCode(@Param('token') t: string, @Body() d: CodeDto) { return this.svc.verifyViewCode(t, d.code); }
  @Post('view/:token/google') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60_000 } }) viewGoogle(@Param('token') t: string, @Body() d: GoogleViewDto) { return this.svc.viewWithGoogle(t, d.credential); }

  @Post('report/:token') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } })
  report(@Param('token') t: string, @Body() d: ReportDto, @Req() req: any) {
    const key = (typeof req.headers['x-real-ip'] === 'string' && req.headers['x-real-ip']) || req.ip;
    return this.svc.report(t, d.reason, d.note, key);
  }

  // --- cần đăng nhập ---
  @Get() @UseGuards(JwtGuard) list(@CurrentUser() u: { sub: string }) { return this.svc.list(u.sub); }
  @Get('inbox') @UseGuards(JwtGuard) inbox(@CurrentUser() u: { sub: string }) { return this.svc.inbox(u.sub); }
  @Post() @UseGuards(JwtGuard) create(@CurrentUser() u: { sub: string }, @Body() d: CreateDto) { return this.svc.create(u.sub, d.type); }
  @Get(':id') @UseGuards(JwtGuard) get(@CurrentUser() u: { sub: string }, @Param('id') id: string) { return this.svc.get(u.sub, id); }
  @Patch(':id') @UseGuards(JwtGuard)
  update(@CurrentUser() u: { sub: string }, @Param('id') id: string, @Body() d: UpdateDto) {
    return this.svc.update(u.sub, id, { ...d, deliverAt: d.deliverAt ? new Date(d.deliverAt) : undefined } as any);
  }
  @Delete(':id') @UseGuards(JwtGuard) remove(@CurrentUser() u: { sub: string }, @Param('id') id: string) { return this.svc.remove(u.sub, id); }
  @Post(':id/send') @UseGuards(JwtGuard)
  send(@CurrentUser() u: { sub: string }, @Param('id') id: string, @Body() d: SendDto) { return this.svc.send(u.sub, id, d.stampId); }
}
