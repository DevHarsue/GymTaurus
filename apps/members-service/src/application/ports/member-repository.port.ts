export interface CreateMemberData {
    userId: string;
    createdBy: string;
    name: string;
    cedula: string;
    phone?: string;
    email?: string;
    fingerprintId?: number;
}

export interface MemberModel {
    id: string;
    userId: string;
    createdBy: string;
    name: string;
    cedula: string;
    phone?: string;
    email?: string;
    fingerprintId?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemberWithStatus extends MemberModel {
    subscriptionStatus: 'active' | 'expired' | 'none';
    daysLeft: number;
}

export interface FindAllMembersOptions {
    status?: 'active' | 'expired' | 'none';
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface MemberRepositoryPort {
    create(payload: CreateMemberData): Promise<MemberModel>;
    findById(id: string): Promise<MemberModel | null>;
    findByCedula(cedula: string): Promise<MemberModel | null>;
    findByFingerprintId(fingerprintId: number): Promise<MemberModel | null>;
    findAll(
        options: FindAllMembersOptions,
    ): Promise<PaginatedResult<MemberWithStatus>>;
    update(
        id: string,
        payload: Partial<Pick<MemberModel, 'name' | 'phone' | 'email'>>,
    ): Promise<MemberModel | null>;
    delete(id: string): Promise<boolean>;
}
