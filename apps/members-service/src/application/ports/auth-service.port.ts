export interface RegisteredUser {
    id: string;
    email: string;
    role: string;
}

export interface AuthServicePort {
    register(email: string, password: string): Promise<RegisteredUser>;
}
