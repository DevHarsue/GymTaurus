import {
    ConflictException,
    Inject,
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { type Role } from '@libs/common';
import { type UserRepositoryPort } from '../ports/user-repository.port';
import { type RefreshTokenRepositoryPort } from '../ports/refresh-token-repository.port';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        @Inject('UserRepositoryPort')
        private readonly userRepository: UserRepositoryPort,
        @Inject('RefreshTokenRepositoryPort')
        private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        this.googleClient = new OAuth2Client(clientId);
    }

    async register(
        email: string,
        password: string,
        role: Role,
    ): Promise<{ id: string; email: string; role: Role }> {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.userRepository.create({
            email,
            passwordHash,
            role,
        });

        return { id: user.id, email: user.email, role: user.role };
    }

    async login(
        email: string,
        password: string,
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; role: Role };
    }> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        await this.refreshTokenRepository.deleteExpiredByUserId(user.id);

        const accessToken = this.generateAccessToken(
            user.id,
            user.email,
            user.role,
        );
        const refreshToken = await this.createRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, role: user.role },
        };
    }

    async loginWithGoogle(idToken?: string, accessToken?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; role: Role };
    }> {
        let email: string;
        let googleId: string;

        try {
            if (idToken) {
                // Flujo móvil: verificar el idToken JWT de Google
                const ticket = await this.googleClient.verifyIdToken({
                    idToken,
                    audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
                });
                const payload = ticket.getPayload();
                if (!payload || !payload.email || !payload.sub) {
                    throw new BadRequestException('Invalid Google id_token');
                }
                email = payload.email;
                googleId = payload.sub;
            } else if (accessToken) {
                // Flujo web (implícito): usar el accessToken para obtener info del usuario
                const res = await fetch(
                    `https://www.googleapis.com/oauth2/v3/userinfo`,
                    { headers: { Authorization: `Bearer ${accessToken}` } },
                );
                if (!res.ok) {
                    throw new BadRequestException('Invalid Google access_token');
                }
                const userInfo = await res.json();
                if (!userInfo.email || !userInfo.sub) {
                    throw new BadRequestException('Google did not return user info');
                }
                email = userInfo.email;
                googleId = userInfo.sub;
            } else {
                throw new BadRequestException('Either idToken or accessToken is required');
            }

            let user = await this.userRepository.findByEmail(email);

            if (user) {
                if (!user.googleId) {
                    user = await this.userRepository.update(user.id, { googleId });
                }
            } else {
                user = await this.userRepository.create({
                    email,
                    googleId,
                    passwordHash: 'GOOGLE_OAUTH',
                    role: 'member' as Role,
                });
            }

            await this.refreshTokenRepository.deleteExpiredByUserId(user.id);

            const jwtAccessToken = this.generateAccessToken(
                user.id,
                user.email,
                user.role,
            );
            const refreshToken = await this.createRefreshToken(user.id);

            return {
                accessToken: jwtAccessToken,
                refreshToken,
                user: { id: user.id, email: user.email, role: user.role },
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new UnauthorizedException('Failed to authenticate with Google');
        }
    }

    async refresh(
        refreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const storedToken =
            await this.refreshTokenRepository.findByToken(refreshToken);
        if (!storedToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (storedToken.expiresAt < new Date()) {
            await this.refreshTokenRepository.deleteByToken(refreshToken);
            throw new UnauthorizedException('Refresh token expired');
        }

        const user = await this.userRepository.findById(storedToken.userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        await this.refreshTokenRepository.deleteByToken(refreshToken);

        const newAccessToken = this.generateAccessToken(
            user.id,
            user.email,
            user.role,
        );
        const newRefreshToken = await this.createRefreshToken(user.id);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    async getProfile(
        userId: string,
    ): Promise<{ id: string; email: string; role: Role }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return { id: user.id, email: user.email, role: user.role };
    }

    async logout(refreshToken: string): Promise<void> {
        await this.refreshTokenRepository.deleteByToken(refreshToken);
    }

    private generateAccessToken(
        userId: string,
        email: string,
        role: Role,
    ): string {
        return this.jwtService.sign({
            sub: userId,
            email,
            role,
        });
    }

    private async createRefreshToken(userId: string): Promise<string> {
        const token = randomUUID();
        const expiresIn = this.configService.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '7d',
        );
        const expiresAt = new Date(Date.now() + this.parseExpiresIn(expiresIn));

        await this.refreshTokenRepository.create({
            userId,
            token,
            expiresAt,
        });

        return token;
    }

    private parseExpiresIn(value: string): number {
        const match = /^(\d+)(s|m|h|d)$/.exec(value);
        if (!match) return 7 * 24 * 60 * 60 * 1000;
        const num = parseInt(match[1]!, 10);
        const unit = match[2]!;
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return num * (multipliers[unit] ?? 24 * 60 * 60 * 1000);
    }
}
