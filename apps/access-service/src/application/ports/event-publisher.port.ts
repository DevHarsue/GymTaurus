export interface EventPublisherPort {
    publish(topic: string, payload: unknown): Promise<void>;
}
