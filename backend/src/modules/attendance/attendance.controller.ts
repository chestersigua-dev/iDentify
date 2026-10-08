import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { AttendanceService, ClassroomCheckInDto } from './attendance.service';

@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('classroom-check')
  async recordClassroomCheck(@Body() dto: ClassroomCheckInDto, @Req() req: any) {
    const log = await this.attendanceService.recordClassroomAttendance(
      dto,
      req.ip,
    );
    return {
      success: true,
      message: 'Attendance record submitted successfully.',
      data: log,
    };
  }

  @Get('roster/:sectionId')
  async getRoster(
    @Param('sectionId') sectionId: string,
    @Query('schoolId') schoolId: string,
    @Query('date') date?: string,
    @Query('subjectName') subjectName?: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const roster = await this.attendanceService.getSectionRosterAttendance(
      sId,
      sectionId,
      date,
      subjectName,
    );
    return {
      success: true,
      count: roster.length,
      data: roster,
    };
  }

  @Get('student/:studentId')
  async getStudentDiary(
    @Param('studentId') studentId: string,
    @Query('schoolId') schoolId: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const logs = await this.attendanceService.getStudentAttendanceDiary(
      sId,
      studentId,
    );
    return {
      success: true,
      count: logs.length,
      data: logs,
    };
  }
}
