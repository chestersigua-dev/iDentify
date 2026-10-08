import { StudentsService, AssignRfidDto } from './students.service';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    getStudents(schoolId: string, sectionId?: string, gradeLevel?: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    getStudentByLrn(lrn: string, schoolId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    assignRfid(dto: AssignRfidDto, schoolId: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    createStudent(body: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateStudent(id: string, body: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteStudent(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkImport(body: {
        schoolId?: string;
        records: any[];
    }, req: any): Promise<{
        success: boolean;
        count: number;
        records: any[];
    }>;
}
