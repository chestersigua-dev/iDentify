import { DatabaseService } from '../../config/database.service';
export declare class AnalyticsService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    getPrincipalDashboard(schoolId: string): Promise<{
        overview: {
            totalStudents: number;
            totalPassing: number;
            totalFailing: number;
            passingRate: string;
            dailyAttendanceRate: string;
            totalFaculty: number;
        };
        studentsByGrade: Record<string, any[]>;
        passingStudents: any[];
        failingStudents: any[];
        teacherAssignments: {
            sectionId: any;
            sectionName: any;
            gradeLevel: any;
            tier: any;
            teacherId: any;
            teacherName: string;
            enrolledCount: number;
            schedule: string;
        }[];
        examTrends: {
            gradingPeriod: string;
            generalAverage: number;
            mathematics: number;
            science: number;
            english: number;
        }[];
    }>;
    getHeadTeacherDashboard(schoolId: string, tier?: string): Promise<{
        assignedTier: string;
        tierTitle: string;
        totalStudentsInTier: number;
        passingStudentsInTier: any[];
        failingStudentsInTier: any[];
        teacherAssignmentsInTier: {
            sectionId: any;
            sectionName: any;
            gradeLevel: any;
            tier: any;
            teacherId: any;
            teacherName: string;
            enrolledCount: number;
            schedule: string;
        }[];
        examTrendsInTier: {
            gradingPeriod: string;
            generalAverage: number;
            mathematics: number;
            science: number;
            english: number;
        }[];
    }>;
}
