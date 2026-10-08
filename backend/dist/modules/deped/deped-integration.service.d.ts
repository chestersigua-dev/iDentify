import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';
export interface DepEdSyncOptions {
    schoolId: string;
    syncType: 'FULL' | 'ENROLLMENT' | 'EOSY_STATUS';
    actorId?: string;
}
export declare class DepEdIntegrationService {
    private readonly db;
    private readonly audit;
    private readonly logger;
    private readonly apiMode;
    constructor(db: DatabaseService, audit: AuditService);
    generateSF1(schoolId: string, sectionId?: string): Promise<{
        formName: string;
        standard: string;
        schoolHeader: {
            schoolName: any;
            schoolId: any;
            district: any;
            division: any;
            region: any;
            schoolYear: string;
            gradeLevel: any;
            section: any;
        };
        summary: {
            totalEnrolled: number;
            maleCount: number;
            femaleCount: number;
            fourPsBeneficiaries: number;
            withDisability: number;
        };
        learners: {
            male: {
                lrn: any;
                learnerName: string;
                sex: any;
                birthdate: any;
                age: any;
                motherTongue: any;
                ipCommunity: any;
                address: string;
                parents: {
                    father: string;
                    mother: string;
                    guardian: string;
                };
                contactNumber: any;
                is4Ps: string;
                remarks: any;
            }[];
            female: {
                lrn: any;
                learnerName: string;
                sex: any;
                birthdate: any;
                age: any;
                motherTongue: any;
                ipCommunity: any;
                address: string;
                parents: {
                    father: string;
                    mother: string;
                    guardian: string;
                };
                contactNumber: any;
                is4Ps: string;
                remarks: any;
            }[];
        };
    }>;
    private mapLearnerToSF1Row;
    generateSF2(schoolId: string, sectionId?: string, month?: string): Promise<{
        formName: string;
        standard: string;
        month: string;
        schoolHeader: {
            schoolName: any;
            schoolId: any;
            district: any;
            division: any;
            region: any;
            gradeLevel: any;
            section: any;
            schoolYear: string;
        };
        schoolDays: string[];
        records: {
            male: {
                lrn: any;
                learnerName: string;
                sex: any;
                dailyRecords: {
                    date: string;
                    status: string;
                    code: string;
                }[];
                totalPresent: number;
                totalAbsent: number;
                totalTardy: number;
                remarks: string;
            }[];
            female: {
                lrn: any;
                learnerName: string;
                sex: any;
                dailyRecords: {
                    date: string;
                    status: string;
                    code: string;
                }[];
                totalPresent: number;
                totalAbsent: number;
                totalTardy: number;
                remarks: string;
            }[];
        };
        summary: {
            enrolledMale: number;
            enrolledFemale: number;
            totalEnrolled: number;
            overallAttendanceRate: string;
        };
    }>;
    generateSF5(schoolId: string, sectionId?: string): Promise<{
        formName: string;
        standard: string;
        schoolHeader: {
            schoolName: any;
            schoolId: any;
            district: any;
            division: any;
            region: any;
            schoolYear: string;
            gradeLevel: any;
            section: any;
        };
        summary: {
            totalPromoted: number;
            totalRetained: number;
            totalConditional: number;
            generalAverageDistribution: {
                outstanding_90_100: number;
                very_satisfactory_85_89: number;
                satisfactory_80_84: number;
                fairly_satisfactory_75_79: number;
                did_not_meet_expectations_below_75: number;
            };
        };
    }>;
    syncWithDepEdLIS(options: DepEdSyncOptions): Promise<{
        syncId: string;
        status: string;
        schoolId: string;
        syncType: "FULL" | "ENROLLMENT" | "EOSY_STATUS";
        recordsSynced: number;
        lrnsValidated: string[];
        timestamp: string;
        lisResponseCode: string;
        message: string;
    }>;
}
