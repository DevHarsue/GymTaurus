import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, Role } from '@libs/common';
import { StatisticsService } from '../../application/services/statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get('health')
    @ApiOperation({ summary: 'Health check de estadísticas' })
    health() {
        return { service: 'members-statistics', status: 'ok' };
    }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Dashboard general con todos los KPIs' })
    @ApiOkResponse({ description: 'KPIs del gimnasio' })
    getDashboard() {
        return this.statisticsService.getDashboard();
    }

    @Get('members')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Estadísticas de miembros' })
    @ApiOkResponse({ description: 'Métricas de miembros' })
    getMemberStats() {
        return this.statisticsService.getMemberStats();
    }

    @Get('subscriptions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Estadísticas de suscripciones' })
    @ApiOkResponse({ description: 'Métricas de suscripciones y planes' })
    getSubscriptionStats() {
        return this.statisticsService.getSubscriptionStats();
    }

    @Get('revenue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Estadísticas de ingresos estimados' })
    @ApiOkResponse({ description: 'Métricas de ingresos' })
    getRevenueStats() {
        return this.statisticsService.getRevenueStats();
    }

    @Get('renewals')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Estadísticas de renovaciones' })
    @ApiOkResponse({ description: 'Métricas de renovaciones' })
    getRenewalStats() {
        return this.statisticsService.getRenewalStats();
    }
}
