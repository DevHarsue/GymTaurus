export interface MemberStatusModel {
    id: string;
    name: string;
    active: boolean;
    daysLeft: number;
    fingerprintId: number;
}

export interface MemberStatusPort {
    findByFingerprint(fingerprintId: number): Promise<MemberStatusModel | null>;
}
