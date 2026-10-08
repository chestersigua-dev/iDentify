import { DatabaseService } from '../../config/database.service';
export interface AuditEntryInput {
    schoolId?: string | null;
    actorId?: string | null;
    actorRole: string;
    action: string;
    targetEntity: string;
    targetId?: string;
    clientIp?: string;
    userAgent?: string;
    payload?: any;
}
export declare class AuditService {
    private readonly db;
    private readonly logger;
    private readonly hmacSalt;
    constructor(db: DatabaseService);
    log(entry: AuditEntryInput): Promise<any>;
    getAuditLogs(schoolId?: string | null, limit?: number): Promise<any[]>;
    verifyChainIntegrity(schoolId?: string | null): Promise<{
        valid: boolean;
        totalRecords: number;
        tamperedIndex: number | null;
        message: string;
    }>;
    clearAuditLogsToZero(): Promise<void>;
}
