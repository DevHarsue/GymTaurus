import { Inject, Injectable } from '@nestjs/common';
import { CreateMemberDto } from '../../api/dtos/create-member.dto';
import {
    type MemberModel,
    type MemberRepositoryPort,
} from '../ports/member-repository.port';
import { type CachePort } from '../ports/cache.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';

@Injectable()
export class MembersService {
    constructor(
        @Inject('MemberRepositoryPort')
        private readonly memberRepository: MemberRepositoryPort,
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
    ) {}

    async createMember(payload: CreateMemberDto): Promise<MemberModel> {
        const member = await this.memberRepository.create(payload);
        await this.cache.set(
            `member:${member.id}`,
            JSON.stringify(member),
            300,
        );
        await this.eventPublisher.publish('members.member.created', member);
        return member;
    }

    async getMember(id: string): Promise<MemberModel | null> {
        return this.memberRepository.findById(id);
    }
}
