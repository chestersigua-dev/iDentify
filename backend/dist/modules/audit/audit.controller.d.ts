import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(schoolId?: string, limit?: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    verifyIntegrity(schoolId?: string): Promise<{
        success: boolean;
        report: {
            valid: boolean;
            totalRecords: number;
            tamperedIndex: number | null;
            message: string;
        };
    }>;
}
