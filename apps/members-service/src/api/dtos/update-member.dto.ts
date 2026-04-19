import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(
    OmitType(CreateMemberDto, ['cedula', 'fingerprintId', 'email', 'password'] as const)
) {}
