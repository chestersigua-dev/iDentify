import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';
export interface AssignRfidDto {
    lrn: string;
    tokenUid: string;
    tokenType?: string;
}
export declare class StudentsService {
    private readonly db;
    private readonly audit;
    private readonly logger;
    constructor(db: DatabaseService, audit: AuditService);
    findAll(schoolId: string, sectionId?: string, gradeLevel?: string): Promise<any[]>;
    findByLrn(schoolId: string, lrn: string): Promise<any>;
    findByTokenUid(schoolId: string, tokenUid: string): Promise<any>;
    assignRfidToken(schoolId: string, dto: AssignRfidDto, actorId?: string): Promise<any>;
    create(schoolId: string, data: any, actorId?: string, actorRole?: string): Promise<any>;
    update(id: string, data: any, actorId?: string, actorRole?: string): Promise<any>;
    delete(id: string, actorId?: string, actorRole?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkImport(schoolId: string, records: any[], actorId?: string): Promise<{
        success: boolean;
        count: number;
        records: any[];
    }>;
}
