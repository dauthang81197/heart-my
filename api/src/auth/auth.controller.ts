import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../common/jwt.guard';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto { @IsEmail() email: string; @IsString() @MinLength(8) @MaxLength(100) password: string; @IsString() @MinLength(1) @MaxLength(80) name: string; }
class LoginDto { @IsEmail() email: string; @IsString() password: string; }
class GoogleDto { @IsString() credential: string; }
class EmailDto { @IsEmail() email: string; }
class TokenDto { @IsString() @MaxLength(100) token: string; }
class ResetDto { @IsString() @MaxLength(100) token: string; @IsString() @MinLength(8) @MaxLength(100) password: string; }

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } }) // chống dò mật khẩu / spam đăng ký
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('register') register(@Body() d: RegisterDto) { return this.auth.register(d.email, d.password, d.name); }
  @Post('login') login(@Body() d: LoginDto) { return this.auth.login(d.email, d.password); }
  @Post('google') google(@Body() d: GoogleDto) { return this.auth.googleLogin(d.credential); }
  @Post('forgot') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60_000 } }) forgot(@Body() d: EmailDto) { return this.auth.forgot(d.email); }
  @Post('reset') @HttpCode(200) reset(@Body() d: ResetDto) { return this.auth.reset(d.token, d.password); }
  @Post('verify') @HttpCode(200) verify(@Body() d: TokenDto) { return this.auth.verify(d.token); }
  @Post('send-verification') @HttpCode(200) @UseGuards(JwtGuard) @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendVerification(@CurrentUser() u: { sub: string }) { return this.auth.sendVerification(u.sub); }
}
