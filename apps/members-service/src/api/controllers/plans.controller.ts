import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '@libs/common';
import { PlansService } from '../../application/services/plans.service';
import { CreatePlanDto } from '../dtos/create-plan.dto';
import { UpdatePlanDto } from '../dtos/update-plan.dto';

@ApiTags('Planes')
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Crear un nuevo plan de membresía' })
    @ApiResponse({ status: 201, description: 'Plan creado exitosamente' })
    create(@Body() payload: CreatePlanDto) {
        return this.plansService.createPlan(payload);
    }

    @Get()
    @ApiOperation({
        summary: 'Listar todos los planes de membresía disponibles',
    })
    findAll() {
        return this.plansService.listPlans();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de un plan específico' })
    @ApiParam({ name: 'id', description: 'UUID del plan' })
    @ApiNotFoundResponse({ description: 'Plan no encontrado' })
    findById(@Param('id') id: string) {
        return this.plansService.getPlan(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar un plan existente' })
    @ApiParam({ name: 'id', description: 'UUID del plan' })
    @ApiNotFoundResponse({ description: 'Plan no encontrado' })
    update(@Param('id') id: string, @Body() payload: UpdatePlanDto) {
        return this.plansService.updatePlan(id, payload);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualización parcial de un plan existente' })
    @ApiParam({ name: 'id', description: 'UUID del plan' })
    @ApiNotFoundResponse({ description: 'Plan no encontrado' })
    patchUpdate(@Param('id') id: string, @Body() payload: UpdatePlanDto) {
        return this.plansService.updatePlan(id, payload);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar (desactivar) un plan' })
    @ApiParam({ name: 'id', description: 'UUID del plan' })
    @ApiNotFoundResponse({ description: 'Plan no encontrado' })
    @ApiResponse({ status: 200, description: 'Plan desactivado exitosamente' })
    remove(@Param('id') id: string) {
        return this.plansService.deletePlan(id);
    }
}
