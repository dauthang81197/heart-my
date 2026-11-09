import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto { @IsEmail() email: string; @IsString() @MinLength(6) password: string; @IsString() @MinLength(1) name: string; }
class LoginDto { @IsEmail() email: string; @IsString() password: string; }
class GoogleDto { @IsString() credential: string; }

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('register') register(@Body() d: RegisterDto) { return this.auth.register(d.email, d.password, d.name); }
  @Post('login') login(@Body() d: LoginDto) { return this.auth.login(d.email, d.password); }
  @Post('google') google(@Body() d: GoogleDto) { return this.auth.googleLogin(d.credential); }
}
