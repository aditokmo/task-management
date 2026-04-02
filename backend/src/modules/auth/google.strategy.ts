import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type VerifyCallback } from 'passport-google-oauth20';
import type { GoogleProfile } from './types/google-profile.type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(configService: ConfigService) {
        super({
            clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    validate(
        _accessToken: string,
        _refreshToken: string,
        profile: { id: string; displayName: string; emails?: { value: string }[] },
        done: VerifyCallback,
    ) {
        const googleProfile: GoogleProfile = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName,
        };
        done(null, googleProfile);
    }
}
