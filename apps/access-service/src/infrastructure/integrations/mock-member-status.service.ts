import { Injectable } from '@nestjs/common';
import {
    type MemberStatusModel,
    type MemberStatusPort,
} from '../../application/ports/member-status.port';

@Injectable()
export class MockMemberStatusService implements MemberStatusPort {
    private readonly byFingerprint = new Map<number, MemberStatusModel>([
        [
            1,
            {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Miembro de prueba',
                active: true,
                daysLeft: 30,
                fingerprintId: 1,
            },
        ],
        [
            2,
            {
                id: '00000000-0000-0000-0000-000000000002',
                name: 'Miembro vencido',
                active: false,
                daysLeft: 0,
                fingerprintId: 2,
            },
        ],
    ]);

    findByFingerprint(
        fingerprintId: number,
    ): Promise<MemberStatusModel | null> {
        return Promise.resolve(this.byFingerprint.get(fingerprintId) ?? null);
    }
}
