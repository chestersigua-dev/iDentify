import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';
export interface CreateUserDto {
    schoolId?: string | null;
    username: string;
    email: string;
    password?: string;
    role: 'SUPER_ADMIN' | 'PRINCIPAL' | 'HEAD_TEACHER' | 'MASTER_TEACHER' | 'TEACHER' | 'ADMIN_ASSISTANT' | 'STAFF' | 'STUDENT' | 'KIOSK';
    position?: string;
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    photoUrl?: string;
    assignedTier?: 'ELEMENTARY' | 'JUNIOR_HIGH' | 'SENIOR_HIGH';
    assignedClasses?: any[];
    rbacPermissions?: any;
    isTwoFactorEnabled?: boolean;
}
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobileNumber?: string;
    role?: 'SUPER_ADMIN' | 'PRINCIPAL' | 'HEAD_TEACHER' | 'MASTER_TEACHER' | 'TEACHER' | 'ADMIN_ASSISTANT' | 'STAFF' | 'STUDENT' | 'KIOSK';
    position?: string;
    photoUrl?: string;
    assignedTier?: 'ELEMENTARY' | 'JUNIOR_HIGH' | 'SENIOR_HIGH';
    assignedClasses?: any[];
    rbacPermissions?: any;
    isTwoFactorEnabled?: boolean;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    isActive?: boolean;
}
export declare class UsersService {
    private readonly db;
    private readonly audit;
    private readonly logger;
    constructor(db: DatabaseService, audit: AuditService);
    findAll(schoolId?: string | null, role?: string, excludeSuperAdmin?: boolean): Promise<any[]>;
    findById(id: string): Promise<any>;
    create(dto: CreateUserDto, actorId?: string): Promise<any>;
    update(id: string, dto: UpdateUserDto, actorId?: string): Promise<any>;
    delete(id: string, actorId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
