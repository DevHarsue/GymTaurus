import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type AccessLogDocument = HydratedDocument<AccessLog>;

@Schema({ collection: 'access_logs', versionKey: false })
export class AccessLog {
    @Prop({ required: true })
    memberId!: string;

    @Prop({ required: true })
    fingerprintId!: number;

    @Prop({ required: true })
    memberName!: string;

    @Prop({ required: true })
    granted!: boolean;

    @Prop({ required: true, enum: ['active', 'expired', 'not_found'] })
    reason!: string;

    @Prop({ required: true })
    deviceId!: string;

    @Prop({ required: true })
    timestamp!: Date;

    @Prop({ default: true })
    synced!: boolean;

    @Prop({ type: Date, default: null })
    checkedOutAt?: Date | null;

    @Prop({ type: String, default: null, enum: ['manual', 'timeout', null] })
    checkoutMethod?: string | null;

    @Prop({ type: Number, default: null })
    durationMinutes?: number | null;
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLog);
