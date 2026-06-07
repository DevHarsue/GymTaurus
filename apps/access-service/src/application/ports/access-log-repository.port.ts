export type AccessReason = 'active' | 'expired' | 'not_found';

/** El evento (huella + timestamp + dispositivo) ya fue registrado. */
export class DuplicateAccessLogError extends Error {
    constructor() {
        super('Evento de acceso duplicado');
        this.name = 'DuplicateAccessLogError';
    }
}

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
    listByMember(memberId: string, limit: number, offset: number): Promise<AccessLogModel[]>;
}
