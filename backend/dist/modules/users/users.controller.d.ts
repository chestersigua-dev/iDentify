import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(schoolId?: string, role?: string, excludeSuperAdmin?: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    getUser(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createUser(dto: CreateUserDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateUser(id: string, dto: UpdateUserDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteUser(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
