import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import type { JwtPayload } from './types/jwt-payload.type';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
        const authResponse = await this.authService.register(dto);
        this.setRefreshTokenCookie(response, authResponse.refreshToken);

        return {
            user: authResponse.user,
            accessToken: authResponse.accessToken,
        };
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
        const authResponse = await this.authService.login(dto);
        this.setRefreshTokenCookie(response, authResponse.refreshToken);

        return {
            user: authResponse.user,
            accessToken: authResponse.accessToken,
        };
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(200)
    async refreshToken(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        const payload = request.user as JwtPayload;
        const authResponse = await this.authService.refresh(payload.sub);
        this.setRefreshTokenCookie(response, authResponse.refreshToken);

        return {
            user: authResponse.user,
            accessToken: authResponse.accessToken,
        };
    }

    @Post('logout')
    @HttpCode(200)
    logout(@Res({ passthrough: true }) response: Response) {
        response.clearCookie('refreshToken', { path: '/' });
        return { success: true };
    }

    private setRefreshTokenCookie(response: Response, refreshToken: string) {
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}
