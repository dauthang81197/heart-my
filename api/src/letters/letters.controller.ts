import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsDateString, IsEmail, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
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
class SendDto { @IsString() stampId: string; }

@Controller('letters')
export class LettersController {
  constructor(private svc: LettersService, private prisma: PrismaService) {}

  // --- public (khai báo trước :id) ---
  @Get('public/feed') feed() { return this.svc.publicFeed(); }
  @Get('view/:token') view(@Param('token') t: string) { return this.svc.viewByToken(t); }

  // --- cần đăng nhập ---
  @Get() @UseGuards(JwtGuard) list(@CurrentUser() u: { sub: string }) { return this.svc.list(u.sub); }
  @Get('inbox') @UseGuards(JwtGuard) inbox(@CurrentUser() u: { email: string }) { return this.svc.inbox(u.email); }
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
