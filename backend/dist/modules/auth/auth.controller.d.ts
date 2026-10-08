import { AuthService, LoginDto } from './auth.service';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: any, res: Response): Promise<{
        requires2FA: boolean;
        userId: any;
        message: string;
        accessToken?: undefined;
        refreshToken?: undefined;
        user?: undefined;
        school?: undefined;
        success: boolean;
    } | {
        accessToken: string;
        refreshToken: string;
        user: any;
        school: any;
        requires2FA?: undefined;
        userId?: undefined;
        message?: undefined;
        success: boolean;
    }>;
    logout(res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    me(req: any): Promise<{
        success: boolean;
        user: any;
    }>;
    setupTwoFactor(body: any, req: any): Promise<{
        secret: string;
        otpauth: string;
        success: boolean;
    }>;
    enableTwoFactor(body: {
        userId?: string;
        token: string;
        secret: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    disableTwoFactor(body: {
        userId?: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
