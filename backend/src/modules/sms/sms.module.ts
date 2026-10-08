import { Module, Global } from '@nestjs/common';
import { SmsService } from './sms.service';
import { DatabaseService } from '../../config/database.service';

@Global()
@Module({
  providers: [SmsService, DatabaseService],
  exports: [SmsService],
})
export class SmsModule {}
