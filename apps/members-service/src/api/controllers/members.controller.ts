import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MembersService } from '../../application/services/members.service';
import { CreateMemberDto } from '../dtos/create-member.dto';

@Controller('members')
export class MembersController {
    constructor(private readonly membersService: MembersService) {}

    @Get('health')
    health(): { service: string; status: string } {
        return { service: 'members-service', status: 'ok' };
    }

    @Post()
    create(@Body() payload: CreateMemberDto) {
        return this.membersService.createMember(payload);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.membersService.getMember(id);
    }
}
