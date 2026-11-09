import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';

@Controller('stamps')
class StampsController {
  constructor(private prisma: PrismaService) {}
  @Get() catalog() { return this.prisma.stamp.findMany({ where: { active: true }, orderBy: { price: 'asc' } }); }
  @Get('mine') @UseGuards(JwtGuard)
  mine(@CurrentUser() u: { sub: string }) {
    return this.prisma.userStamp.findMany({ where: { userId: u.sub, quantity: { gt: 0 } }, include: { stamp: true } });
  }
}
@Module({ imports: [AuthModule], controllers: [StampsController] })
export class StampsModule {}
