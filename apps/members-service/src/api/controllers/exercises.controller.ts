import {
    Body,
    Controller,
    Delete,
    Get,
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
import { ExercisesService } from '../../application/services/exercises.service';
import { CreateExerciseDto } from '../dtos/create-exercise.dto';
import { UpdateExerciseDto } from '../dtos/update-exercise.dto';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';

@ApiTags('Ejercicios')
@Controller('exercises')
export class ExercisesController {
    constructor(private readonly exercisesService: ExercisesService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear un ejercicio en el catalogo' })
    @ApiResponse({ status: 201, description: 'Ejercicio creado' })
    create(
        @Body() payload: CreateExerciseDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.exercisesService.createExercise(payload, user.sub);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar el catalogo de ejercicios' })
    @ApiQuery({
        name: 'includeInactive',
        required: false,
        description: 'Incluir ejercicios desactivados (solo gestion)',
    })
    findAll(@Query('includeInactive') includeInactive?: string) {
        return this.exercisesService.listExercises(includeInactive === 'true');
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener un ejercicio por ID' })
    @ApiParam({ name: 'id', description: 'UUID del ejercicio' })
    @ApiNotFoundResponse({ description: 'Ejercicio no encontrado' })
    findById(@Param('id') id: string) {
        return this.exercisesService.getExercise(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar un ejercicio' })
    @ApiParam({ name: 'id', description: 'UUID del ejercicio' })
    @ApiNotFoundResponse({ description: 'Ejercicio no encontrado' })
    update(@Param('id') id: string, @Body() payload: UpdateExerciseDto) {
        return this.exercisesService.updateExercise(id, payload);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @UseInterceptors(IdempotencyInterceptor)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar (desactivar) un ejercicio' })
    @ApiParam({ name: 'id', description: 'UUID del ejercicio' })
    @ApiNotFoundResponse({ description: 'Ejercicio no encontrado' })
    remove(@Param('id') id: string) {
        return this.exercisesService.deleteExercise(id);
    }
}
