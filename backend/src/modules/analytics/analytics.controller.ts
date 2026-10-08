import { Controller, Get, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('principal')
  async getPrincipalDashboard(@Query('schoolId') schoolId: string) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const data = await this.analyticsService.getPrincipalDashboard(sId);
    return {
      success: true,
      data,
    };
  }

  @Get('head-teacher')
  async getHeadTeacherDashboard(
    @Query('schoolId') schoolId: string,
    @Query('tier') tier?: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const data = await this.analyticsService.getHeadTeacherDashboard(sId, tier || 'JUNIOR_HIGH');
    return {
      success: true,
      data,
    };
  }
}
