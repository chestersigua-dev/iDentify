import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('api/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(
    @Query('schoolId') schoolId?: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditService.getAuditLogs(
      schoolId || null,
      limit ? parseInt(limit, 10) : 100,
    );
    return {
      success: true,
      count: logs.length,
      data: logs,
    };
  }

  @Get('verify')
  async verifyIntegrity(@Query('schoolId') schoolId?: string) {
    const report = await this.auditService.verifyChainIntegrity(schoolId || null);
    return {
      success: true,
      report,
    };
  }
}
