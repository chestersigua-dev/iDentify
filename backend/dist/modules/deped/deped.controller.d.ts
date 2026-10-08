import { DepEdIntegrationService } from './deped-integration.service';
export declare class DepEdController {
    private readonly depedService;
    constructor(depedService: DepEdIntegrationService);
    getSchoolForm1(schoolId: string, sectionId?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getSchoolForm2(schoolId: string, sectionId?: string, month?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getSchoolForm5(schoolId: string, sectionId?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    syncLIS(body: any, req: any): Promise<{
        success: boolean;
        data: {
            syncId: string;
            status: string;
            schoolId: string;
            syncType: "FULL" | "ENROLLMENT" | "EOSY_STATUS";
            recordsSynced: number;
            lrnsValidated: string[];
            timestamp: string;
            lisResponseCode: string;
            message: string;
        };
    }>;
}
