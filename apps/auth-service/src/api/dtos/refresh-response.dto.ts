import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken!: string;

    @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
    refreshToken!: string;
}
