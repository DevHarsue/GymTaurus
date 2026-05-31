import {
    Controller,
    Get,
    Param,
    Query,
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
import { AuditLogService } from '../../application/services/audit-log.service';
import { GetAuditLogQueryDto } from '../dtos/get-audit-log-query.dto';

@ApiTags('Auditoria')
@Controller('audit')
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) {}

    @Get('log')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Listar el log de auditoria del sistema (paginado y filtrable)',
        description:
            'Retorna las entradas del audit.audit_log enriquecidas con el email del actor (LEFT JOIN auth.users). ' +
            'Ordenadas por fecha descendente. Solo accesible por administradores.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista paginada de entradas de auditoria',
    })
    async findAll(@Query() query: GetAuditLogQueryDto) {
        return this.auditLogService.listAuditLog({
            page: query.page,
            limit: query.limit,
            schema: query.schema,
            table: query.table,
            operation: query.operation,
            actorId: query.actorId,
            rowId: query.rowId,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        });
    }

    @Get('log/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obtener detalle completo de una entrada de auditoria',
        description:
            'Incluye old_data y new_data (JSONB) para reconstruir el diff. Solo administradores.',
    })
    @ApiParam({ name: 'id', description: 'ID numerico de la entrada de auditoria' })
    @ApiNotFoundResponse({ description: 'Entrada de auditoria no encontrada' })
    findOne(@Param('id') id: string) {
        return this.auditLogService.getAuditEntry(id);
    }
}
