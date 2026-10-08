import { Module } from '@nestjs/common';
import { DatabaseService } from './config/database.service';
import { AuditModule } from './modules/audit/audit.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { SmsModule } from './modules/sms/sms.module';
import { KioskModule } from './modules/kiosk/kiosk.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { DepEdModule } from './modules/deped/deped.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AuditModule,
    SchoolsModule,
    UsersModule,
    AuthModule,
    StudentsModule,
    SmsModule,
    KioskModule,
    AttendanceModule,
    DepEdModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class AppModule {}
