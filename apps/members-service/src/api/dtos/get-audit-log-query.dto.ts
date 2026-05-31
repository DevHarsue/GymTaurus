import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator';

export enum AuditOperationParam {
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export enum AuditSchemaParam {
    AUTH = 'auth',
    MEMBERS = 'members',
}

export class GetAuditLogQueryDto {
    @ApiPropertyOptional({ example: 1, minimum: 1 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? Number(value) : value))
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
    @IsOptional()
    @Transform(({ value }) => (value !== undefined ? Number(value) : value))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({ enum: AuditSchemaParam })
    @IsOptional()
    @IsEnum(AuditSchemaParam)
    schema?: AuditSchemaParam;

    @ApiPropertyOptional({
        example: 'members',
        description:
            'Nombre fisico de la tabla (ej: members, membership_plans, subscriptions, renewals, devices, users)',
    })
    @IsOptional()
    @IsString()
    table?: string;

    @ApiPropertyOptional({ enum: AuditOperationParam })
    @IsOptional()
    @IsEnum(AuditOperationParam)
    operation?: AuditOperationParam;

    @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
    @IsOptional()
    @IsUUID()
    actorId?: string;

    @ApiPropertyOptional({
        example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        description: 'ID de la fila afectada (UUID en formato texto)',
    })
    @IsOptional()
    @IsString()
    rowId?: string;

    @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;
}
