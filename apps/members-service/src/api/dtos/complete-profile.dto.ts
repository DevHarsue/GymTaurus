import { ApiProperty } from '@nestjs/swagger';
import { IsTaurusCedula, IsTaurusPhone } from '@libs/common';

export class CompleteProfileDto {
    @ApiProperty({ example: '12345678' })
    @IsTaurusCedula()
    cedula!: string;

    @ApiProperty({ example: '584141771490' })
    @IsTaurusPhone()
    phone!: string;
}
