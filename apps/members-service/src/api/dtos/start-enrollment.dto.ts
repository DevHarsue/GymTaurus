import { IsString, MinLength } from 'class-validator';

export class StartEnrollmentDto {
    @IsString()
    @MinLength(1)
    deviceId!: string;
}
