import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';

@Entity({ schema: 'auth', name: 'users' })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', name: 'password_hash', length: 255 })
    passwordHash!: string;

    @Column({ type: 'varchar', length: 20 })
    role!: string;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
    refreshTokens!: RefreshTokenEntity[];
}
