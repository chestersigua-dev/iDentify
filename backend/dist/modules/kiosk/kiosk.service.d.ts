import { DatabaseService } from '../../config/database.service';
import { StudentsService } from '../students/students.service';
import { SmsService } from '../sms/sms.service';
import { AuditService } from '../audit/audit.service';
export interface KioskScanInput {
    schoolId: string;
    tokenUid: string;
    kioskStationId?: string;
}
export interface KioskScanResponse {
    success: boolean;
    status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED';
    message: string;
    student: {
        id: string;
        lrn: string;
        fullName: string;
        gradeLevel: string;
        sectionName: string;
        photoUrl: string;
    };
    eventTimestamp: string;
    isDebounced: boolean;
    minutesFromFirstTap: number;
    smsDispatched: boolean;
}
export declare class KioskService {
    private readonly db;
    private readonly studentsService;
    private readonly smsService;
    private readonly audit;
    private readonly logger;
    private redisClient;
    private localDebounceCache;
    constructor(db: DatabaseService, studentsService: StudentsService, smsService: SmsService, audit: AuditService);
    private initRedis;
    processScan(input: KioskScanInput, clientIp?: string): Promise<KioskScanResponse>;
}
