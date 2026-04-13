import {
    Body,
    Controller,
    Get,
    ParseArrayPipe,
    Post,
    Query,
} from '@nestjs/common';
import { AccessService } from '../../application/services/access.service';
import { AccessLogQueryDto } from '../dtos/access-log-query.dto';
import { SyncAccessItemDto } from '../dtos/sync-access-item.dto';

@Controller('access')
export class AccessController {
    constructor(private readonly accessService: AccessService) {}

    @Get('health')
    health(): { service: string; status: string } {
        return { service: 'access-service', status: 'ok' };
    }

    @Get('log')
    listLogs(@Query() query: AccessLogQueryDto) {
        const limit = query.limit ?? 50;
        const offset = query.offset ?? 0;
        return this.accessService.listLogs(limit, offset);
    }

    @Post('sync')
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
