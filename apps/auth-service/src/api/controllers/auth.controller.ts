import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiOkResponse,
    ApiCreatedResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    CurrentUser,
    JwtAuthGuard,
    type JwtPayload,
    Role,
    Roles,
    RolesGuard,
} from '@libs/common';
import { AuthService } from '../../application/services/auth.service';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { LogoutRequestDto } from '../dtos/logout-request.dto';
import { RefreshResponseDto } from '../dtos/refresh-response.dto';
import { RefreshTokenRequestDto } from '../dtos/refresh-token-request.dto';
import { RegisterRequestDto } from '../dtos/register-request.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('health')
    @ApiOperation({
        summary: 'Health check',
        description: 'Verifica que el auth-service está corriendo correctamente. No requiere autenticación.',
    })
    health(): { service: string; status: string } {
        return { service: 'auth-service', status: 'ok' };
    }

    @Post('register')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Registrar un nuevo usuario (solo admin)',
        description:
            'Crea un nuevo usuario en el sistema. Solo accesible por usuarios con rol admin. ' +
            'La contraseña se hashea con bcrypt (10 salt rounds) antes de almacenarse. ' +
            'Si el email ya existe, retorna 409 Conflict. ' +
            'No genera tokens — el usuario creado debe hacer login por separado.',
    })
    @ApiCreatedResponse({ type: RegisterResponseDto, description: 'Usuario creado exitosamente' })
    @ApiConflictResponse({ description: 'El email ya está registrado en el sistema' })
    @ApiUnauthorizedResponse({ description: 'No autenticado o no tiene rol admin' })
    register(@Body() dto: RegisterRequestDto) {
        return this.authService.register(dto.email, dto.password, dto.role);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Iniciar sesión con email y contraseña',
        description:
            'Autentica un usuario con email y contraseña. Si las credenciales son válidas, ' +
            'retorna un access token JWT (15min) y un refresh token opaco (7d). ' +
            'El refresh token se almacena en la base de datos y puede ser usado una sola vez (rotación). ' +
            'Se permite tener múltiples sesiones activas (ej: celular + computadora). ' +
            'Los refresh tokens expirados del usuario se limpian automáticamente en cada login.',
    })
    @ApiOkResponse({ type: LoginResponseDto, description: 'Login exitoso, retorna tokens y datos del usuario' })
    @ApiUnauthorizedResponse({ description: 'Email no encontrado o contraseña incorrecta' })
    login(@Body() dto: LoginRequestDto) {
        return this.authService.login(dto.email, dto.password);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Renovar access token (rota el refresh token)',
        description:
            'Genera un nuevo access token JWT y un nuevo refresh token a partir de un refresh token válido. ' +
            'Implementa rotación de tokens: el refresh token enviado se elimina de la base de datos ' +
            'y se genera uno nuevo. Esto significa que cada refresh token solo puede usarse una vez. ' +
            'Si el token ya fue usado, no existe, o está expirado, retorna 401.',
    })
    @ApiOkResponse({ type: RefreshResponseDto, description: 'Tokens renovados exitosamente' })
    @ApiUnauthorizedResponse({ description: 'Refresh token inválido, expirado o ya utilizado' })
    refresh(@Body() dto: RefreshTokenRequestDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obtener perfil del usuario autenticado',
        description:
            'Retorna los datos del usuario autenticado extraídos del JWT. ' +
            'Requiere un access token válido en el header Authorization (Bearer). ' +
            'Usado por la app móvil para obtener el perfil del usuario logueado.',
    })
    @ApiOkResponse({ type: RegisterResponseDto, description: 'Datos del usuario autenticado' })
    @ApiUnauthorizedResponse({ description: 'Token JWT ausente, inválido o expirado' })
    getProfile(@CurrentUser() user: JwtPayload) {
        return this.authService.getProfile(user.sub);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Cerrar sesión (revocar refresh token)',
        description:
            'Revoca un refresh token específico, invalidando esa sesión. ' +
            'No cierra otras sesiones activas del mismo usuario. ' +
            'Si el refresh token no existe (ya fue revocado o expiró), la operación es silenciosa — no da error. ' +
            'Requiere un access token válido en el header Authorization.',
    })
    @ApiOkResponse({ description: 'Sesión cerrada exitosamente' })
    @ApiUnauthorizedResponse({ description: 'Token JWT ausente, inválido o expirado' })
    async logout(@Body() dto: LogoutRequestDto) {
        await this.authService.logout(dto.refreshToken);
        return { message: 'Logged out successfully' };
    }
}
