import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccessService } from '../../application/services/access.service';
import { RegisterAccessDto } from '../dtos/register-access.dto';

@Controller('access')
export class AccessController {
    constructor(private readonly accessService: AccessService) {}

    @Get('health')
    health(): { service: string; status: string } {
        return { service: 'access-service', status: 'ok' };
    }

    @Post('logs')
    register(@Body() payload: RegisterAccessDto) {
        return this.accessService.register(payload);
    }
}
