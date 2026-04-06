import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  Put,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import type { JwtPayload } from './types/jwt-payload.type';
import type { GoogleProfile } from './types/google-profile.type';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResponse = await this.authService.register(dto);
    this.setRefreshTokenCookie(response, authResponse.refreshToken);

    return {
      user: authResponse.user,
      accessToken: authResponse.accessToken,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    const profile = request.user as GoogleProfile;
    const authResponse = await this.authService.googleLogin(profile);
    this.setRefreshTokenCookie(response, authResponse.refreshToken);

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const params = new URLSearchParams({
      accessToken: authResponse.accessToken,
      userId: authResponse.user.id,
      email: authResponse.user.email,
      ...(authResponse.user.name ? { name: authResponse.user.name } : {}),
    });
    response.redirect(`${frontendUrl}/oauth/callback?${params.toString()}`);
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

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() request: Request) {
    const payload = request.user as JwtPayload;
    return this.authService.getProfile(payload.sub);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() request: Request,
    @Body() dto: UpdateProfileDto,
  ) {
    const payload = request.user as JwtPayload;
    return this.authService.updateProfile(payload.sub, dto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  async changePassword(
    @Req() request: Request,
    @Body() dto: ChangePasswordDto,
  ) {
    const payload = request.user as JwtPayload;
    return this.authService.changePassword(payload.sub, dto);
  }
}
