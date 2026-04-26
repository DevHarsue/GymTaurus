export interface EnrollRequestPayload {
    member_id: string;
    fingerprint_id: number;
    device_id: string;
}

export interface EnrollDeletePayload {
    member_id: string;
    fingerprint_id: number;
    device_id: string;
}

export interface EnrollProgressPayload {
    member_id: string;
    fingerprint_id: number;
    device_id: string;
    step: string;
    status: string;
    message: string;
}

export type EnrollProgressListener = (payload: EnrollProgressPayload) => void;

export interface EnrollmentMqttPort {
    publishEnrollRequest(payload: EnrollRequestPayload): void;
    publishEnrollDelete(payload: EnrollDeletePayload): void;
    onEnrollProgress(listener: EnrollProgressListener): () => void;
}
