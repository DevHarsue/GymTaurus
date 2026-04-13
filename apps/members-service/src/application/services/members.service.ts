import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMemberDto } from '../../api/dtos/create-member.dto';
import { UpdateMemberDto } from '../../api/dtos/update-member.dto';
import {
    FindAllMembersOptions,
    PaginatedResult,
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
        const existing = await this.memberRepository.findByCedula(payload.cedula);
        if (existing) {
            throw new ConflictException(`Member with cedula ${payload.cedula} already exists`);
        }

        const member = await this.memberRepository.create(payload);
        await this.cache.set(`member:${member.id}`, JSON.stringify(member), 300);
        await this.eventPublisher.publish('members.member.created', member);
        return member;
    }

    async getMember(id: string): Promise<MemberModel | null> {
        const cached = await this.cache.get(`member:${id}`);
        if (cached) {
            return JSON.parse(cached) as MemberModel;
        }

        const member = await this.memberRepository.findById(id);
        if (member) {
            await this.cache.set(`member:${id}`, JSON.stringify(member), 300);
        }
        return member;
    }

    async listMembers(options: FindAllMembersOptions): Promise<PaginatedResult<MemberModel>> {
        return this.memberRepository.findAll(options);
    }

    async updateMember(id: string, payload: UpdateMemberDto): Promise<MemberModel> {
        const member = await this.memberRepository.update(id, payload);
        if (!member) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        await this.cache.set(`member:${id}`, JSON.stringify(member), 300);
        return member;
    }

    async deleteMember(id: string): Promise<void> {
        const deleted = await this.memberRepository.delete(id);
        if (!deleted) {
            throw new NotFoundException(`Member with ID ${id} not found`);
        }
        await this.cache.delete(`member:${id}`);
        await this.eventPublisher.publish('members.member.deleted', { id });
    }

    async findByFingerprintId(fingerprintId: number): Promise<MemberModel | null> {
        return this.memberRepository.findByFingerprintId(fingerprintId);
    }
}
