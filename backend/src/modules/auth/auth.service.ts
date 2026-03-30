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

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new ConflictException('Email is already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
            },
        });

        return this.buildAuthResponse(user.id, user.email, user.name ?? undefined);
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return this.buildAuthResponse(user.id, user.email, user.name ?? undefined);
    }

    private buildAuthResponse(userId: string, email: string, name?: string) {
        const payload: JwtPayload = { sub: userId, email };

        const token = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });

        return {
            user: {
                id: userId,
                email,
                name,
            },
            token,
        };
    }
}
