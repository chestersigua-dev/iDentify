import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';
export interface ClassroomCheckInDto {
    schoolId: string;
    studentId: string;
    sectionId: string;
    teacherId: string;
    subjectName?: string;
    state: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'DROPPED';
    remarks?: string;
    date?: string;
}
export declare class AttendanceService {
    private readonly db;
    private readonly audit;
    private readonly logger;
    constructor(db: DatabaseService, audit: AuditService);
    recordClassroomAttendance(dto: ClassroomCheckInDto, clientIp?: string): Promise<any>;
    getSectionRosterAttendance(schoolId: string, sectionId: string, date?: string, subjectName?: string): Promise<any[]>;
    getStudentAttendanceDiary(schoolId: string, studentId: string): Promise<any[]>;
}
