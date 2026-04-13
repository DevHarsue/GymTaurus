import { ApiProperty } from '@nestjs/swagger';

class UserDto {
    @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    id!: string;

    @ApiProperty({ example: 'admin@taurus.gym' })
    email!: string;

    @ApiProperty({ example: 'admin' })
    role!: string;
}

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken!: string;

    @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
    refreshToken!: string;

    @ApiProperty({ type: UserDto })
    user!: UserDto;
}
