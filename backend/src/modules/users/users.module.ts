import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, DatabaseService, AuditService],
  exports: [UsersService],
})
export class UsersModule {}
