import { AttendanceService, ClassroomCheckInDto } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    recordClassroomCheck(dto: ClassroomCheckInDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    getRoster(sectionId: string, schoolId: string, date?: string, subjectName?: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    getStudentDiary(studentId: string, schoolId: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
}
