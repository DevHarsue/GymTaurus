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
import { CreateRoutineDto } from '../dtos/create-routine.dto';
import { UpdateRoutineDto } from '../dtos/update-routine.dto';
import { SetMemberScheduleDto } from '../dtos/set-member-schedule.dto';
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

    // ─── Gestión de rutinas (admin) ─────────────────────────────────────

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear una rutina (con días y ejercicios)' })
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

    // ─── Miembro autenticado (offline-first) ────────────────────────────

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Horario semanal del miembro autenticado (rutina por día)',
    })
    async findMySchedule(@CurrentUser() user: JwtPayload) {
        const member = await this.membersService.getMemberByUserId(user.sub);
        if (!member) {
            throw new NotFoundException(
                'No existe un perfil de miembro asociado a este usuario',
            );
        }
        return this.routinesService.getMemberSchedule(member.id);
    }

    @Get('me/history')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Historial de entrenamientos del miembro autenticado',
    })
    @ApiQuery({ name: 'limit', required: false, description: 'Máximo de registros' })
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
        summary: 'Registrar un entrenamiento del miembro (reps/peso/tiempo/distancia)',
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

    // ─── Horario semanal de un miembro (admin) ──────────────────────────

    @Get('member/:memberId/schedule')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener el horario semanal de un miembro' })
    @ApiParam({ name: 'memberId', description: 'UUID del miembro' })
    getMemberSchedule(@Param('memberId') memberId: string) {
        return this.routinesService.getMemberSchedule(memberId);
    }

    @Put('member/:memberId/schedule')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Definir el horario semanal de un miembro (rutina por día)',
    })
    @ApiParam({ name: 'memberId', description: 'UUID del miembro' })
    @ApiNotFoundResponse({ description: 'Rutina no encontrada' })
    setMemberSchedule(
        @Param('memberId') memberId: string,
        @Body() payload: SetMemberScheduleDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.routinesService.setMemberSchedule(
            memberId,
            payload,
            user.sub,
        );
    }

    @Get('member/:memberId/history')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Historial de entrenamientos de un miembro (seguimiento admin)',
    })
    @ApiParam({ name: 'memberId', description: 'UUID del miembro' })
    @ApiQuery({ name: 'limit', required: false, description: 'Máximo de registros' })
    getMemberHistory(
        @Param('memberId') memberId: string,
        @Query('limit') limit?: string,
    ) {
        return this.workoutLogsService.getHistory(
            memberId,
            limit ? parseInt(limit, 10) : undefined,
        );
    }

    // ─── Detalle / edición de una rutina (admin) ────────────────────────

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Detalle completo de una rutina (días + ejercicios)' })
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
    @ApiOperation({ summary: 'Actualizar una rutina (reemplaza días/ejercicios)' })
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
