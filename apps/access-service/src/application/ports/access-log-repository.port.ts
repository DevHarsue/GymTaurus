export type AccessReason = 'active' | 'expired' | 'not_found';

export interface CreateAccessLogInput {
    memberId: string;
    fingerprintId: number;
    memberName: string;
    granted: boolean;
    reason: AccessReason;
    deviceId: string;
    timestamp: Date;
    synced: boolean;
}

export interface AccessLogModel {
    memberId: string;
    fingerprintId: number;
    memberName: string;
    granted: boolean;
    reason: AccessReason;
    deviceId: string;
    timestamp: Date;
}

export interface AccessLogRepositoryPort {
    create(payload: CreateAccessLogInput): Promise<AccessLogModel>;
    listRecent(limit: number, offset: number): Promise<AccessLogModel[]>;
    listByMember(memberId: string): Promise<AccessLogModel[]>;
}
