export interface RefreshTokenModel {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface RefreshTokenRepositoryPort {
    findByToken(token: string): Promise<RefreshTokenModel | null>;
    findByUserId(userId: string): Promise<RefreshTokenModel[]>;
    create(data: {
        userId: string;
        token: string;
        expiresAt: Date;
    }): Promise<RefreshTokenModel>;
    deleteByToken(token: string): Promise<boolean>;
    deleteExpiredByUserId(userId: string): Promise<void>;
}
