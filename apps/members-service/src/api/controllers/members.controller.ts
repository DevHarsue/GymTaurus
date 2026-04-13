import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiNotFoundResponse, ApiBadRequestResponse, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MembersService } from '../../application/services/members.service';
import { SubscriptionsService } from '../../application/services/subscriptions.service';
import { CreateMemberDto } from '../dtos/create-member.dto';
import { UpdateMemberDto } from '../dtos/update-member.dto';
import { RenewSubscriptionDto } from '../dtos/renew-subscription.dto';

interface MemberResponse {
    id: string;
    name: string;
    cedula: string;
    phone?: string;
    email?: string;
    status: string;
    daysLeft: number;
    fingerprintId?: number;
}

@ApiTags('Miembros')
@Controller('members')
export class MembersController {
    constructor(
        private readonly membersService: MembersService,
        private readonly subscriptionsService: SubscriptionsService,
    ) {}

    @Get('health')
    @ApiOperation({ summary: 'Verificar el estado de salud del servicio de miembros' })
    health(): { service: string; status: string } {
        return { service: 'members-service', status: 'ok' };
    }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo miembro del gimnasio' })
    @ApiBadRequestResponse({ description: 'Datos inválidos o cédula/huella duplicada' })
    @ApiResponse({ status: 201, description: 'Miembro creado exitosamente' })
    async create(@Body() payload: CreateMemberDto) {
        const member = await this.membersService.createMember(payload);
        return {
            id: member.id,
            name: member.name,
            cedula: member.cedula,
            status: 'expired',
        };
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los miembros con paginación y filtros' })
    @ApiQuery({ name: 'status', required: false, enum: ['active', 'expired'], description: 'Filtrar por estado de suscripción' })
    @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o cédula' })
    @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
    @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de resultados por página' })
    async findAll(
        @Query('status') status?: 'active' | 'expired',
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.membersService.listMembers({
            status,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    private async buildMemberResponse(memberId: string): Promise<MemberResponse> {
        const member = await this.membersService.getMember(memberId);
        if (!member) {
            throw new NotFoundException(`Miembro con ID ${memberId} no encontrado`);
        }

        const activeSub = await this.subscriptionsService.getActiveSubscription(member.id);
        const now = new Date();
        let daysLeft = 0;
        let subStatus = 'expired';

        if (activeSub && new Date(activeSub.expiresAt) > now) {
            daysLeft = Math.ceil((new Date(activeSub.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            subStatus = 'active';
        }

        return {
            id: member.id,
            name: member.name,
            cedula: member.cedula,
            phone: member.phone,
            email: member.email,
            status: subStatus,
            daysLeft,
            fingerprintId: member.fingerprintId,
        };
    }

    @Get('by-fingerprint/:fpId')
    @ApiOperation({ summary: 'Validación rápida de miembro por lector de huellas IoT' })
    @ApiParam({ name: 'fpId', description: 'ID de huella almacenado en el sensor biométrico' })
    @ApiNotFoundResponse({ description: 'No se encontró ningún miembro con esa huella' })
    async findByFingerprint(@Param('fpId', ParseIntPipe) fpId: number) {
        const member = await this.membersService.findByFingerprintId(fpId);
        if (!member) {
            throw new NotFoundException('Miembro no encontrado para esa huella');
        }
        
        const response = await this.buildMemberResponse(member.id);
        return {
            id: response.id,
            name: response.name,
            active: response.status === 'active',
            daysLeft: response.daysLeft,
        };
    }

    @Get(':id/status')
    @ApiOperation({ summary: 'Obtener el estado actual de la suscripción de un miembro' })
    @ApiParam({ name: 'id', description: 'UUID del miembro' })
    @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
    async getStatus(@Param('id') id: string) {
        const response = await this.buildMemberResponse(id);
        return {
            name: response.name,
            active: response.status === 'active',
            daysLeft: response.daysLeft,
            fingerprintId: response.fingerprintId,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles completos de un miembro por ID' })
    @ApiParam({ name: 'id', description: 'UUID del miembro' })
    @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
    async findById(@Param('id') id: string) {
        return this.buildMemberResponse(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Actualizar el perfil de un miembro existente' })
    @ApiParam({ name: 'id', description: 'UUID del miembro' })
    @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
    async update(@Param('id') id: string, @Body() payload: UpdateMemberDto) {
        return this.membersService.updateMember(id, payload);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un miembro del sistema' })
    @ApiParam({ name: 'id', description: 'UUID del miembro' })
    @ApiNotFoundResponse({ description: 'Miembro no encontrado' })
    @ApiResponse({ status: 200, description: 'Miembro eliminado exitosamente' })
    async remove(@Param('id') id: string) {
        return this.membersService.deleteMember(id);
    }

    @Post(':id/renew')
    @ApiOperation({ summary: 'Comprar o renovar un plan de suscripción para un miembro' })
    @ApiParam({ name: 'id', description: 'UUID del miembro' })
    @ApiNotFoundResponse({ description: 'Miembro o Plan no encontrado' })
    @ApiBadRequestResponse({ description: 'Plan seleccionado no válido' })
    async renew(
        @Param('id') id: string,
        @Body() payload: RenewSubscriptionDto,
    ) {
        const adminId = '00000000-0000-0000-0000-000000000000';
        return this.subscriptionsService.renewSubscription(id, payload, adminId);
    }
}
