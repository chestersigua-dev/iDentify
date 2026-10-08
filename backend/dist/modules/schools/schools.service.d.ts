import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';
export interface CreateSchoolDto {
    depedSchoolId: string;
    slug: string;
    name: string;
    shortName?: string;
    division: string;
    region: string;
    district?: string;
    barangay: string;
    municipalityCity: string;
    province: string;
    postalCode?: string;
    contactPhone?: string;
    contactEmail?: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    schoolHeadName?: string;
    schoolHeadTitle?: string;
}
export interface PurgeSchoolDto {
    adminPassword: string;
    totpToken: string;
}
export declare class SchoolsService {
    private readonly db;
    private readonly audit;
    private readonly logger;
    constructor(db: DatabaseService, audit: AuditService);
    findAll(): Promise<any[]>;
    findById(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    create(dto: CreateSchoolDto, actorId?: string): Promise<any>;
    update(id: string, data: any, actorId?: string, actorRole?: string): Promise<any>;
    purgeSchoolCascade(schoolId: string, dto: PurgeSchoolDto, superAdminUserId: string, clientIp?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    purgeAllDataExceptSuperAdmin(actorRole: string, actorId: string, clientIp?: string): Promise<{
        success: boolean;
        message: string;
        backup: {
            fileName: string;
            sha256: string;
            totalEntries: number;
            entries: any[];
        };
    }>;
    factoryResetSystemToZero(actorRole: string, actorId: string, clientIp?: string): Promise<{
        success: boolean;
        message: string;
        backup: {
            fileName: string;
            sha256: string;
            totalEntries: number;
            entries: any[];
        };
    }>;
    prepareForLaunch(actorRole: string, actorId: string, clientIp?: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
