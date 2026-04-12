import { CreateMemberDto } from '../../api/dtos/create-member.dto';

export interface MemberModel {
    id: string;
    userId: string;
    name: string;
    cedula: string;
    phone?: string;
    email?: string;
    fingerprintId?: number;
}

export interface MemberRepositoryPort {
    create(payload: CreateMemberDto): Promise<MemberModel>;
    findById(id: string): Promise<MemberModel | null>;
}
