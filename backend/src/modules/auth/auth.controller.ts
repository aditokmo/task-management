import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
        const authResponse = await this.authService.register(dto);
        response.cookie('token', authResponse.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
        });

        return authResponse;
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
        const authResponse = await this.authService.login(dto);
        response.cookie('token', authResponse.token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
        });

        return authResponse;
    }

    @Post('logout')
    @HttpCode(200)
    logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('token', { path: '/' });
        return { success: true };
    }
}
