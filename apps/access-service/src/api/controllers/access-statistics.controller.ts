import { Controller, Get, Query } from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { AccessStatisticsService } from '../../application/services/access-statistics.service';

@ApiTags('Access Statistics')
@Controller('statistics')
export class AccessStatisticsController {
    constructor(
        private readonly statisticsService: AccessStatisticsService,
    ) {}

    @Get('health')
    @ApiOperation({ summary: 'Health check de estadísticas de acceso' })
    health() {
        return { service: 'access-statistics', status: 'ok' };
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Dashboard completo de estadísticas de acceso' })
    @ApiOkResponse({ description: 'KPIs de acceso al gimnasio' })
    getDashboard() {
        return this.statisticsService.getDashboard();
    }

    @Get('overview')
    @ApiOperation({ summary: 'Resumen de accesos (hoy, semana, mes)' })
    @ApiOkResponse({ description: 'Conteo de accesos y tasa de denegación' })
    getOverview() {
        return this.statisticsService.getOverview();
    }

    @Get('hourly')
    @ApiOperation({ summary: 'Distribución de accesos por hora' })
    @ApiQuery({ name: 'days', required: false, description: 'Período en días (default: 30)' })
    @ApiOkResponse({ description: 'Accesos agrupados por hora del día' })
    getHourly(@Query('days') days?: string) {
        return this.statisticsService.getHourlyDistribution(
            days ? parseInt(days, 10) : 30,
        );
    }

    @Get('daily')
    @ApiOperation({ summary: 'Distribución de accesos por día de la semana' })
    @ApiQuery({ name: 'weeks', required: false, description: 'Período en semanas (default: 4)' })
    @ApiOkResponse({ description: 'Accesos agrupados por día de la semana' })
    getDaily(@Query('weeks') weeks?: string) {
        return this.statisticsService.getDailyDistribution(
            weeks ? parseInt(weeks, 10) : 4,
        );
    }

    @Get('top-members')
    @ApiOperation({ summary: 'Miembros con más visitas (último mes)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de resultados (default: 10)' })
    @ApiOkResponse({ description: 'Ranking de miembros por asistencia' })
    getTopMembers(@Query('limit') limit?: string) {
        return this.statisticsService.getTopMembers(
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @Get('denials')
    @ApiOperation({ summary: 'Desglose de accesos denegados por razón' })
    @ApiQuery({ name: 'days', required: false, description: 'Período en días (default: 30)' })
    @ApiOkResponse({ description: 'Conteo de denegaciones agrupado por razón' })
    getDenials(@Query('days') days?: string) {
        return this.statisticsService.getDenialBreakdown(
            days ? parseInt(days, 10) : 30,
        );
    }
}
