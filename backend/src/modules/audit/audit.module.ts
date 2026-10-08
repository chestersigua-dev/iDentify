import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { DatabaseService } from '../../config/database.service';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, DatabaseService],
  exports: [AuditService],
})
export class AuditModule {}
