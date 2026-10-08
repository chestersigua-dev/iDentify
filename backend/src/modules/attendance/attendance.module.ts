import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, DatabaseService, AuditService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
