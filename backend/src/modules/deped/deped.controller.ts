import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
} from '@nestjs/common';
import { DepEdIntegrationService, DepEdSyncOptions } from './deped-integration.service';

@Controller('api/deped')
export class DepEdController {
  constructor(private readonly depedService: DepEdIntegrationService) {}

  @Get('sf1')
  async getSchoolForm1(
    @Query('schoolId') schoolId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const sf1 = await this.depedService.generateSF1(sId, sectionId);
    return {
      success: true,
      data: sf1,
    };
  }

  @Get('sf2')
  async getSchoolForm2(
    @Query('schoolId') schoolId: string,
    @Query('sectionId') sectionId?: string,
    @Query('month') month?: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const sf2 = await this.depedService.generateSF2(sId, sectionId, month);
    return {
      success: true,
      data: sf2,
    };
  }

  @Get('sf5')
  async getSchoolForm5(
    @Query('schoolId') schoolId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const sf5 = await this.depedService.generateSF5(sId, sectionId);
    return {
      success: true,
      data: sf5,
    };
  }

  @Post('sync-lis')
  async syncLIS(@Body() body: any, @Req() req: any) {
    const sId = body.schoolId || '11111111-1111-1111-1111-111111111111';
    const result = await this.depedService.syncWithDepEdLIS({
      schoolId: sId,
      syncType: body.syncType || 'FULL',
      actorId: req?.user?.id,
    });
    return {
      success: true,
      data: result,
    };
  }
}
