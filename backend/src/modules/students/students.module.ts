import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, DatabaseService, AuditService],
  exports: [StudentsService],
})
export class StudentsModule {}
