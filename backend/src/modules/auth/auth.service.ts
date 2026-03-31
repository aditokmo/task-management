import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    private get userModel() {
        return (this.prisma as any).user;
    }

    async register(dto: RegisterDto) {
        const existingUser = await this.userModel.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new ConflictException('Email is already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.userModel.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
            },
        });

        return this.buildAuthResponse(user.id, user.email, user.name ?? undefined);
    }

    async login(dto: LoginDto) {
        const user = await this.userModel.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return this.buildAuthResponse(user.id, user.email, user.name ?? undefined);
    }

    async refresh(userId: string) {
        const user = await this.userModel.findUnique({ where: { id: userId } });
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        try {
            this.jwtService.verify(user.refreshToken, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });
        } catch {
            throw new UnauthorizedException('Refresh token expired');
        }

        return this.buildAuthResponse(user.id, user.email, user.name ?? undefined);
    }

    private async buildAuthResponse(userId: string, email: string, name?: string) {
        const payload: JwtPayload = { sub: userId, email };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });

        // Store refresh token in database
        await this.userModel.update({
            where: { id: userId },
            data: { refreshToken },
        });

        return {
            user: {
                id: userId,
                email,
                name,
            },
            accessToken,
            refreshToken,
        };
    }
}
