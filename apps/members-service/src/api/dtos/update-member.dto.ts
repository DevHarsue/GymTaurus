import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';

// Para UpdateMemberDto extraemos lo que no se debe poder actualizar (userId, cedula)
// y lo hacemos Partial
export class UpdateMemberDto extends PartialType(
    OmitType(CreateMemberDto, ['userId', 'cedula', 'fingerprintId'] as const)
) {}
