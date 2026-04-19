import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateMemberDto } from '../../api/dtos/create-member.dto';
import { UpdateMemberDto } from '../../api/dtos/update-member.dto';
import {
    FindAllMembersOptions,
    PaginatedResult,
    type MemberModel,
    type MemberWithStatus,
    type MemberRepositoryPort,
} from '../ports/member-repository.port';
import { type CachePort } from '../ports/cache.port';
import { type EventPublisherPort } from '../ports/event-publisher.port';
import { type AuthServicePort } from '../ports/auth-service.port';

@Injectable()
export class MembersService {
    constructor(
        @Inject('MemberRepositoryPort')
        private readonly memberRepository: MemberRepositoryPort,
        @Inject('CachePort')
        private readonly cache: CachePort,
        @Inject('EventPublisherPort')
        private readonly eventPublisher: EventPublisherPort,
        @Inject('AuthServicePort')
        private readonly authService: AuthServicePort,
    ) {}

    async createMember(
        payload: CreateMemberDto,
        createdBy: string,
    ): Promise<MemberModel & { temporaryPassword?: string }> {
        const existing = await this.memberRepository.findByCedula(payload.cedula);
        if (existing) {
            throw new ConflictException(`Member with cedula ${payload.cedula} already exists`);
        }

        const generatedPassword = payload.password ? undefined : randomBytes(6).toString('base64url');
        const password = payload.password ?? generatedPassword!;

        const registeredUser = await this.authService.register(payload.email, password);

        const member = await this.memberRepository.create({
            userId: registeredUser.id,
            createdBy,
            name: payload.name,
            cedula: payload.cedula,
            email: payload.email,
            phone: payload.phone,
            fingerprintId: payload.fingerprintId,
        });

        await this.cache.set(`member:${member.id}`, JSON.stringify(member), 300);
        await this.eventPublisher.publish('members.member.created', member);
        return { ...member, temporaryPassword: generatedPassword };
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

    async listMembers(options: FindAllMembersOptions): Promise<PaginatedResult<MemberWithStatus>> {
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
