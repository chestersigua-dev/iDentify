import { Module } from '@nestjs/common';
import { KioskService } from './kiosk.service';
import { KioskController } from './kiosk.controller';
import { DatabaseService } from '../../config/database.service';
import { StudentsModule } from '../students/students.module';
import { SmsModule } from '../sms/sms.module';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [StudentsModule, SmsModule],
  controllers: [KioskController],
  providers: [KioskService, DatabaseService, AuditService],
  exports: [KioskService],
})
export class KioskModule {}
