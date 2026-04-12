import { RegisterAccessDto } from '../../api/dtos/register-access.dto';

export interface AccessLogModel {
    memberId: string;
    fingerprintId: number;
    memberName: string;
    granted: boolean;
    reason: string;
    deviceId: string;
    timestamp: Date;
}

export interface AccessLogRepositoryPort {
    create(payload: RegisterAccessDto): Promise<AccessLogModel>;
    listByMember(memberId: string): Promise<AccessLogModel[]>;
}
