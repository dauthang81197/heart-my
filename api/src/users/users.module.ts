import { Body, Controller, Get, Module, Patch, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';

class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(1) name?: string;
  @IsOptional() @IsString() avatar?: string;
  @IsOptional() @IsIn(['vi', 'en']) locale?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
}

@Controller('users')
@UseGuards(JwtGuard)
class UsersController {
  constructor(private prisma: PrismaService) {}
  @Get('me') async me(@CurrentUser() u: { sub: string }) {
    const { passwordHash, ...rest } = await this.prisma.user.findUniqueOrThrow({ where: { id: u.sub } });
    return { ...rest, hasPassword: !!passwordHash };
  }
  @Patch('me') async update(@CurrentUser() u: { sub: string }, @Body() d: UpdateMeDto) {
    const { password, ...rest } = d;
    const data: any = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const { passwordHash, ...user } = await this.prisma.user.update({ where: { id: u.sub }, data });
    return user;
  }
}
@Module({ imports: [AuthModule], controllers: [UsersController] })
export class UsersModule {}
