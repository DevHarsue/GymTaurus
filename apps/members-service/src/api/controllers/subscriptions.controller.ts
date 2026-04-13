import {
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param,
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
import { SubscriptionsService } from '../../application/services/subscriptions.service';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto';
import { type SubscriptionModel } from '../../application/ports/subscription-repository.port';

@ApiTags('Suscripciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Post()
    @ApiOperation({ summary: 'Crear una nueva suscripción (Uso Interno)' })
    @ApiResponse({
        status: 201,
        description: 'Suscripción creada exitosamente',
    })
    create(@Body() payload: CreateSubscriptionDto) {
        return this.subscriptionsService.createSubscription(payload);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todo el historial de suscripciones' })
    findAll() {
        return this.subscriptionsService.listSubscriptions();
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Obtener detalles de una suscripción específica por ID',
    })
    @ApiParam({ name: 'id', description: 'UUID de la suscripción' })
    @ApiNotFoundResponse({ description: 'Suscripción no encontrada' })
    async findById(@Param('id') id: string) {
        const sub = await this.subscriptionsService.getSubscription(id);
        if (!sub) {
            throw new NotFoundException(
                `Suscripción con ID ${id} no encontrada`,
            );
        }
        return sub;
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar una suscripción existente' })
    @ApiParam({ name: 'id', description: 'UUID de la suscripción' })
    @ApiNotFoundResponse({ description: 'Suscripción no encontrada' })
    update(
        @Param('id') id: string,
        @Body() payload: Partial<Omit<SubscriptionModel, 'id'>>,
    ) {
        return this.subscriptionsService.updateSubscription(id, payload);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una suscripción del sistema' })
    @ApiParam({ name: 'id', description: 'UUID de la suscripción' })
    @ApiNotFoundResponse({ description: 'Suscripción no encontrada' })
    @ApiResponse({
        status: 200,
        description: 'Suscripción eliminada exitosamente',
    })
    remove(@Param('id') id: string) {
        return this.subscriptionsService.deleteSubscription(id);
    }
}
