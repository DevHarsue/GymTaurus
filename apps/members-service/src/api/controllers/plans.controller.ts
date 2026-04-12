import { Body, Controller, Post } from '@nestjs/common';
import { PlansService } from '../../application/services/plans.service';
import { CreatePlanDto } from '../dtos/create-plan.dto';

@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) {}

    @Post()
    create(@Body() payload: CreatePlanDto) {
        return this.plansService.createPlan(payload);
    }
}
