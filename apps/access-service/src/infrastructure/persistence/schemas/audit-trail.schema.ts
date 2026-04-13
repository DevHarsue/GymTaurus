import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument } from 'mongoose';

export type AuditTrailDocument = HydratedDocument<AuditTrail>;

@Schema({ collection: 'audit_trail', versionKey: false })
export class AuditTrail {
    @Prop({
        required: true,
        enum: [
            'member_created',
            'member_updated',
            'member_renewed',
            'membership_expired',
            'access_granted',
            'access_denied',
        ],
    })
    action!: string;

    @Prop({ type: String, default: null })
    actor_id?: string | null;

    @Prop({ type: String, default: null })
    actor_email?: string | null;

    @Prop({ required: true, enum: ['member', 'system'] })
    target_type!: string;

    @Prop({ type: String, default: null })
    target_id?: string | null;

    @Prop({ type: Object, default: {} })
    details!: Record<string, unknown>;

    @Prop({ required: true })
    timestamp!: Date;
}

export const AuditTrailSchema = SchemaFactory.createForClass(AuditTrail);
