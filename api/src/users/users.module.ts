import { BadRequestException, Body, Controller, Delete, Get, Module, Patch, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Equals, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';

class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsIn(['vi', 'en']) locale?: string;
  @IsOptional() @IsString() @MinLength(8) @MaxLength(100) password?: string;
}
class DeleteMeDto { @Equals('XOA') confirm: string; }

@Controller('users')
@UseGuards(JwtGuard)
class UsersController {
  constructor(private prisma: PrismaService) {}
  @Get('me') async me(@CurrentUser() u: { sub: string }) {
    const { passwordHash, ...rest } = await this.prisma.user.findUniqueOrThrow({ where: { id: u.sub } });
    return { ...rest, hasPassword: !!passwordHash };
  }
  /** Xoá tài khoản: xoá toàn bộ thư + kho tem, ẩn danh hoá hồ sơ (giữ đơn hàng để đối soát kế toán), thu hồi mọi token. */
  @Delete('me') @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async remove(@CurrentUser() u: { sub: string }, @Body() _d: DeleteMeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: u.sub } });
    if (!user) throw new BadRequestException();
    if (user.role === 'ADMIN') throw new BadRequestException('Không thể tự xoá tài khoản quản trị');
    await this.prisma.$transaction([
      this.prisma.letter.deleteMany({ where: { authorId: u.sub } }),
      this.prisma.userStamp.deleteMany({ where: { userId: u.sub } }),
      this.prisma.authToken.deleteMany({ where: { userId: u.sub } }),
      this.prisma.user.update({
        where: { id: u.sub },
        data: { email: `deleted-${u.sub}@deleted.invalid`, name: 'Tài khoản đã xoá', avatar: null, passwordHash: null, googleId: null, emailVerified: false, deletedAt: new Date(), tokenVersion: { increment: 1 } },
      }),
    ]);
    return { ok: true };
  }

  @Patch('me') async update(@CurrentUser() u: { sub: string }, @Body() d: UpdateMeDto) {
    const { password, ...rest } = d;
    const data: any = { ...rest };
    if (password) { data.passwordHash = await bcrypt.hash(password, 10); }
    const { passwordHash, ...user } = await this.prisma.user.update({ where: { id: u.sub }, data });
    return user;
  }
}
@Module({ imports: [AuthModule], controllers: [UsersController] })
export class UsersModule {}
