import { type Role } from '@libs/common';

export interface UserModel {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserRepositoryPort {
    findByEmail(email: string): Promise<UserModel | null>;
    findById(id: string): Promise<UserModel | null>;
    create(data: {
        email: string;
        passwordHash: string;
        role: Role;
    }): Promise<UserModel>;
}
