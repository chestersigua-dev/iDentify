import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DatabaseService } from '../../config/database.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DatabaseService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
