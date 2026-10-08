import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [SchoolsController],
  providers: [SchoolsService, DatabaseService, AuditService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
