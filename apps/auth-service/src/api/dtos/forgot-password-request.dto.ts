import { ApiProperty } from '@nestjs/swagger';
import { IsTaurusEmail } from '@libs/common';

export class ForgotPasswordRequestDto {
    @ApiProperty({ example: 'user@taurus.gym' })
    @IsTaurusEmail()
    email!: string;
}
