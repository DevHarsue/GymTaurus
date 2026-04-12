import {
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    MinLength,
} from 'class-validator';

export class CreateMemberDto {
    @IsUUID()
    userId!: string;

    @IsString()
    @MinLength(2)
    name!: string;

    @IsString()
    cedula!: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsInt()
    fingerprintId?: number;
}
