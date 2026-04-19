import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import {
    type AuthServicePort,
    type RegisteredUser,
} from '../../application/ports/auth-service.port';

@Injectable()
export class AuthHttpService implements AuthServicePort {
    private readonly baseUrl =
        process.env.AUTH_SERVICE_BASE_URL ?? 'http://auth-service:3000';

    async register(email: string, password: string): Promise<RegisteredUser> {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: 'member' }),
        });

        if (response.status === 409) {
            throw new ConflictException('El email ya está registrado en el sistema');
        }

        if (!response.ok) {
            throw new BadRequestException(
                `Error al registrar usuario en auth-service: ${response.status}`,
            );
        }

        return (await response.json()) as RegisteredUser;
    }
}
