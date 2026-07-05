import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    CurrentUser,
    JwtAuthGuard,
    type JwtPayload,
    Role,
    Roles,
    RolesGuard,
} from '@libs/common';
import { MembersService } from '../../application/services/members.service';
import { RoutinesService } from '../../application/services/routines.service';
import { WorkoutLogsService } from '../../application/services/workout-logs.service';
import { AssignRoutineDto } from '../dtos/assign-routine.dto';
import { CreateRoutineDto } from '../dtos/create-routine.dto';
import { UpdateRoutineDto } from '../dtos/update-routine.dto';
import { LogWorkoutDto } from '../dtos/log-workout.dto';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@ApiTags('Rutinas')
@Controller('routines')
export class RoutinesController {
    constructor(
        private readonly routinesService: RoutinesService,
        private readonly workoutLogsService: WorkoutLogsService,
        private readonly membersService: MembersService,
    ) {}

    // ─── Gestion (admin) ────────────────────────────────────────────────

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una rutina (con dias y ejercicios)' })
    @ApiResponse({ status: 201, description: 'Rutina creada' })
    create(@Body() payload: CreateRoutineDto, @CurrentUser() user: JwtPayload) {
        return this.routinesService.createRoutine(payload, user.sub);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar las rutinas disponibles' })
    findAll() {
        return this.routinesService.listRoutines();
    }

    @Post('assign')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Asignar una rutina a un miembro por dia de semana',
    })
    @ApiNotFoundResponse({ description: 'Rutina no encontrada' })
    assign(@Body() payload: AssignRoutineDto, @CurrentUser() user: JwtPayload) {
        return this.routinesService.assignRoutine(payload, user.sub);
    }

    // ─── Miembro autenticado (offline-first) ────────────────────────────

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Bundle de la rutina del miembro autenticado (asignacion + rutina)',
    })
    async findMyRoutine(@CurrentUser() user: JwtPayload) {
        const member = await this.membersService.getMemberByUserId(user.sub);
        if (!member) {
            throw new NotFoundException(
                'No existe un perfil de miembro asociado a este usuario',
            );
        }
        return this.routinesService.getMemberBundle(member.id);
    }

    @Get('me/history')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Historial de entrenamientos del miembro autenticado',
    })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximo de registros' })
    async findMyHistory(
        @CurrentUser() user: JwtPayload,
        @Query('limit') limit?: string,
    ) {
        const member = await this.membersService.getMemberByUserId(user.sub);
        if (!member) {
            throw new NotFoundException(
                'No existe un perfil de miembro asociado a este usuario',
            );
        }
        return this.workoutLogsService.getHistory(
            member.id,
            limit ? parseInt(limit, 10) : undefined,
        );
    }

    @Post('me/logs')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Registrar un entrenamiento (pesos/reps reales) del miembro',
    })
    @ApiResponse({ status: 201, description: 'Entrenamiento registrado' })
    async logMyWorkout(
        @Body() payload: LogWorkoutDto,
        @CurrentUser() user: JwtPayload,
    ) {
        const member = await this.membersService.getMemberByUserId(user.sub);
        if (!member) {
            throw new NotFoundException(
                'No existe un perfil de miembro asociado a este usuario',
            );
        }
        return this.workoutLogsService.logWorkout(member.id, payload);
    }

    // ─── Consulta de asignacion de un miembro (admin) ───────────────────

    @Get('member/:memberId/assignment')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener la asignacion activa de un miembro' })
    @ApiParam({ name: 'memberId', description: 'UUID del miembro' })
    getMemberAssignment(@Param('memberId') memberId: string) {
        return this.routinesService.getMemberAssignment(memberId);
    }

    // ─── Detalle / edicion de una rutina (admin) ────────────────────────

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Detalle completo de una rutina (dias + ejercicios)' })
    @ApiParam({ name: 'id', description: 'UUID de la rutina' })
    @ApiNotFoundResponse({ description: 'Rutina no encontrada' })
    findById(@Param('id') id: string) {
        return this.routinesService.getRoutine(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar una rutina (reemplaza dias/ejercicios)' })
    @ApiParam({ name: 'id', description: 'UUID de la rutina' })
    @ApiNotFoundResponse({ description: 'Rutina no encontrada' })
    update(@Param('id') id: string, @Body() payload: UpdateRoutineDto) {
        return this.routinesService.updateRoutine(id, payload);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar (desactivar) una rutina' })
    @ApiParam({ name: 'id', description: 'UUID de la rutina' })
    @ApiNotFoundResponse({ description: 'Rutina no encontrada' })
    remove(@Param('id') id: string) {
        return this.routinesService.deleteRoutine(id);
    }
}
