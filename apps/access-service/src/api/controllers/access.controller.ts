import {
    Body,
    Controller,
    Get,
    ParseArrayPipe,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { AccessService } from '../../application/services/access.service';
import { AccessLogQueryDto } from '../dtos/access-log-query.dto';
import { SyncAccessItemDto } from '../dtos/sync-access-item.dto';

@ApiTags('Access')
@Controller('access')
export class AccessController {
    constructor(private readonly accessService: AccessService) {}

    @Get('health')
    @ApiOperation({ summary: 'Health check del access-service' })
    @ApiOkResponse({ description: 'Servicio disponible' })
    health(): { service: string; status: string } {
        return { service: 'access-service', status: 'ok' };
    }

    @Get('log')
    @ApiOperation({ summary: 'Listar logs de acceso' })
    @ApiOkResponse({ description: 'Listado de eventos de acceso' })
    listLogs(@Query() query: AccessLogQueryDto) {
        const limit = query.limit ?? 50;
        const offset = query.offset ?? 0;
        return this.accessService.listLogs(limit, offset);
    }

    @Post('sync')
    @ApiOperation({ summary: 'Sincronizar lote offline de eventos de acceso' })
    @ApiOkResponse({ description: 'Resultado del procesamiento del lote' })
    @ApiBadRequestResponse({
        description: 'Payload inválido para sincronización',
    })
    sync(
        @Body(
            new ParseArrayPipe({
                items: SyncAccessItemDto,
                whitelist: true,
            }),
        )
        payload: SyncAccessItemDto[],
    ) {
        return this.accessService.syncBatch(payload);
    }
}
