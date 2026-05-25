import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Put,
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
    OptionalJwtAuthGuard,
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
import { GoogleLoginDto } from '../dtos/google-login.dto';
import { ForgotPasswordRequestDto } from '../dtos/forgot-password-request.dto';
import { ResetPasswordRequestDto } from '../dtos/reset-password-request.dto';
import { ChangePasswordRequestDto } from '../dtos/change-password-request.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('health')
    @ApiOperation({
        summary: 'Health check',
        description:
            'Verifica que el auth-service está corriendo correctamente. No requiere autenticación.',
    })
    health(): { service: string; status: string } {
        return { service: 'auth-service', status: 'ok' };
    }

    @Post('register')
    @UseGuards(OptionalJwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Registrar un nuevo usuario',
        description:
            'Crea un nuevo usuario en el sistema. ' +
            'Sin token: registro público, siempre crea con rol "member". ' +
            'Con token de admin: puede crear cualquier rol (incluido admin). ' +
            'La contraseña se hashea con bcrypt (10 salt rounds) antes de almacenarse. ' +
            'Si el email ya existe, retorna 409 Conflict. ' +
            'No genera tokens — el usuario creado debe hacer login por separado.',
    })
    @ApiCreatedResponse({
        type: RegisterResponseDto,
        description: 'Usuario creado exitosamente',
    })
    @ApiConflictResponse({
        description: 'El email ya está registrado en el sistema',
    })
    register(
        @Body() dto: RegisterRequestDto,
        @CurrentUser() user?: JwtPayload,
    ) {
        const isAdmin = user?.role === Role.ADMIN;
        const role = isAdmin && dto.role ? dto.role : Role.MEMBER;
        return this.authService.register(dto.email, dto.password, role);
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
    @ApiOkResponse({
        type: LoginResponseDto,
        description: 'Login exitoso, retorna tokens y datos del usuario',
    })
    @ApiUnauthorizedResponse({
        description: 'Email no encontrado o contraseña incorrecta',
    })
    login(@Body() dto: LoginRequestDto) {
        return this.authService.login(dto.email, dto.password);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Solicitar restablecimiento de contrasena',
        description:
            'Genera un token de restablecimiento de contrasena si el email existe. ' +
            'El token se loguea en consola del servidor (no se envia email aun). ' +
            'Siempre retorna el mismo mensaje para prevenir enumeracion de emails.',
    })
    @ApiOkResponse({ description: 'Solicitud procesada' })
    forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Restablecer contrasena con token',
        description:
            'Verifica el token de restablecimiento y cambia la contrasena. ' +
            'El token es de un solo uso y expira en 1 hora.',
    })
    @ApiOkResponse({ description: 'Contrasena restablecida exitosamente' })
    @ApiUnauthorizedResponse({
        description: 'Token invalido o expirado',
    })
    resetPassword(@Body() dto: ResetPasswordRequestDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @Put('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Cambiar contrasena del usuario autenticado',
        description:
            'Permite al usuario cambiar su contrasena proporcionando la contrasena actual y la nueva. ' +
            'Requiere autenticacion JWT.',
    })
    @ApiOkResponse({ description: 'Contrasena actualizada exitosamente' })
    @ApiUnauthorizedResponse({
        description: 'Contrasena actual incorrecta o token invalido',
    })
    changePassword(
        @Body() dto: ChangePasswordRequestDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.authService.changePassword(
            user.sub,
            dto.currentPassword,
            dto.newPassword,
        );
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Iniciar sesión con Google',
        description: 'Autentica a un usuario usando un idToken provisto por Google Sign-In. Si el usuario no existe, lo crea automáticamente.',
    })
    @ApiOkResponse({
        type: LoginResponseDto,
        description: 'Login exitoso con Google, retorna tokens y datos del usuario',
    })
    @ApiUnauthorizedResponse({
        description: 'Token de Google inválido',
    })
    loginWithGoogle(@Body() dto: GoogleLoginDto) {
        return this.authService.loginWithGoogle(dto.idToken, dto.accessToken);
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
    @ApiOkResponse({
        type: RefreshResponseDto,
        description: 'Tokens renovados exitosamente',
    })
    @ApiUnauthorizedResponse({
        description: 'Refresh token inválido, expirado o ya utilizado',
    })
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
    @ApiOkResponse({
        type: RegisterResponseDto,
        description: 'Datos del usuario autenticado',
    })
    @ApiUnauthorizedResponse({
        description: 'Token JWT ausente, inválido o expirado',
    })
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
    @ApiUnauthorizedResponse({
        description: 'Token JWT ausente, inválido o expirado',
    })
    async logout(@Body() dto: LogoutRequestDto) {
        await this.authService.logout(dto.refreshToken);
        return { message: 'Logged out successfully' };
    }
}
