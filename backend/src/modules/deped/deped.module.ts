import { Module } from '@nestjs/common';
import { DepEdIntegrationService } from './deped-integration.service';
import { DepEdController } from './deped.controller';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [DepEdController],
  providers: [DepEdIntegrationService, DatabaseService, AuditService],
  exports: [DepEdIntegrationService],
})
export class DepEdModule {}
