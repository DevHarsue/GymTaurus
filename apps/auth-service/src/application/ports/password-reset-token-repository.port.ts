export interface PasswordResetTokenModel {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface PasswordResetTokenRepositoryPort {
    findByToken(token: string): Promise<PasswordResetTokenModel | null>;
    create(data: {
        userId: string;
        token: string;
        expiresAt: Date;
    }): Promise<PasswordResetTokenModel>;
    deleteByToken(token: string): Promise<boolean>;
    deleteByUserId(userId: string): Promise<void>;
}
