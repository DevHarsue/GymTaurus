import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type AccessLogDocument = HydratedDocument<AccessLog>;

@Schema({ collection: 'access_logs', versionKey: false })
export class AccessLog {
    @Prop({ required: true })
    member_id!: string;

    @Prop({ required: true })
    fingerprint_id!: number;

    @Prop({ required: true })
    member_name!: string;

    @Prop({ required: true })
    granted!: boolean;

    @Prop({ required: true, enum: ['active', 'expired', 'not_found'] })
    reason!: string;

    @Prop({ required: true })
    device_id!: string;

    @Prop({ required: true })
    timestamp!: Date;

    @Prop({ default: true })
    synced!: boolean;

    @Prop({ type: Date, default: null })
    checked_out_at?: Date | null;

    @Prop({ type: String, default: null, enum: ['manual', 'timeout', null] })
    checkout_method?: string | null;

    @Prop({ type: Number, default: null })
    duration_minutes?: number | null;
}

export const AccessLogSchema = SchemaFactory.createForClass(AccessLog);
