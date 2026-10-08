import { SchoolsService, CreateSchoolDto, PurgeSchoolDto } from './schools.service';
export declare class SchoolsController {
    private readonly schoolsService;
    constructor(schoolsService: SchoolsService);
    getAllSchools(): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    getSchool(identifier: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createSchool(dto: CreateSchoolDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateSchool(id: string, body: any, headerRole: string, queryRole: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    purgeSchool(id: string, dto: PurgeSchoolDto, headerRole: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    purgeAllDataExceptSuperAdmin(body: any, headerRole: string, req: any): Promise<{
        success: boolean;
        message: string;
        backup: {
            fileName: string;
            sha256: string;
            totalEntries: number;
            entries: any[];
        };
    }>;
    factoryResetSystemToZero(body: any, headerRole: string, req: any): Promise<{
        success: boolean;
        message: string;
        backup: {
            fileName: string;
            sha256: string;
            totalEntries: number;
            entries: any[];
        };
    }>;
    prepareForLaunch(body: any, headerRole: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
