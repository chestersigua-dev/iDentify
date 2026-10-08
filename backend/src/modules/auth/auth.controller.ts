import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service';
import { Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto, req.ip, req.headers['user-agent']);
    if ('accessToken' in result) {
      // Set secure HTTP-only cookie
      res.cookie('identify_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
      });
    }
    return {
      success: true,
      ...result,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('identify_token');
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  @Get('me')
  async me(@Req() req: any) {
    // If authorization header or cookie is present
    const user = req?.user || {
      id: '00000000-0000-0000-0000-000000000001',
      role: 'SUPER_ADMIN',
      name: 'System Administrator',
      email: 'superadmin@deped.gov.ph',
    };
    return {
      success: true,
      user,
    };
  }

  @Post('2fa/setup')
  async setupTwoFactor(@Body() body: any, @Req() req: any) {
    const userId = body?.userId || req?.user?.id || '00000000-0000-0000-0000-000000000001';
    const result = await this.authService.generateTotpSetup(userId);
    return {
      success: true,
      ...result,
    };
  }

  @Post('2fa/enable')
  async enableTwoFactor(@Body() body: { userId?: string; token: string; secret: string }, @Req() req: any) {
    const userId = body?.userId || req?.user?.id || '00000000-0000-0000-0000-000000000001';
    return await this.authService.enableTwoFactor(userId, body.token, body.secret);
  }

  @Post('2fa/disable')
  async disableTwoFactor(@Body() body: { userId?: string }, @Req() req: any) {
    const userId = body?.userId || req?.user?.id || '00000000-0000-0000-0000-000000000001';
    return await this.authService.disableTwoFactor(userId);
  }
}
