import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';
export interface LoginDto {
    usernameOrEmail: string;
    password: string;
    schoolSlug?: string;
    totpCode?: string;
}
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    private readonly audit;
    private readonly logger;
    constructor(db: DatabaseService, jwtService: JwtService, audit: AuditService);
    validateUser(identifier: string, pass: string): Promise<any>;
    login(loginDto: LoginDto, clientIp?: string, userAgent?: string): Promise<{
        requires2FA: boolean;
        userId: any;
        message: string;
        accessToken?: undefined;
        refreshToken?: undefined;
        user?: undefined;
        school?: undefined;
    } | {
        accessToken: string;
        refreshToken: string;
        user: any;
        school: any;
        requires2FA?: undefined;
        userId?: undefined;
        message?: undefined;
    }>;
    generateTotpSetup(userId: string): Promise<{
        secret: string;
        otpauth: string;
    }>;
    enableTwoFactor(userId: string, token: string, secret: string): Promise<{
        success: boolean;
        message: string;
    }>;
    disableTwoFactor(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
