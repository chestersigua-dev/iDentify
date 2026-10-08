import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { StudentsService, AssignRfidDto } from './students.service';

@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async getStudents(
    @Query('schoolId') schoolId: string,
    @Query('sectionId') sectionId?: string,
    @Query('gradeLevel') gradeLevel?: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const students = await this.studentsService.findAll(sId, sectionId, gradeLevel);
    return {
      success: true,
      count: students.length,
      data: students,
    };
  }

  @Get('lrn/:lrn')
  async getStudentByLrn(
    @Param('lrn') lrn: string,
    @Query('schoolId') schoolId: string,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const student = await this.studentsService.findByLrn(sId, lrn);
    return {
      success: true,
      data: student,
    };
  }

  @Post('assign-rfid')
  async assignRfid(
    @Body() dto: AssignRfidDto,
    @Query('schoolId') schoolId: string,
    @Req() req: any,
  ) {
    const sId = schoolId || '11111111-1111-1111-1111-111111111111';
    const token = await this.studentsService.assignRfidToken(sId, dto, req?.user?.id);
    return {
      success: true,
      message: `RFID Tag '${dto.tokenUid}' paired to LRN ${dto.lrn} successfully.`,
      data: token,
    };
  }

  @Post()
  async createStudent(@Body() body: any, @Req() req: any) {
    const schoolId = body.schoolId || '11111111-1111-1111-1111-111111111111';
    const student = await this.studentsService.create(schoolId, body, req?.user?.id);
    return {
      success: true,
      message: `Student with LRN ${body.lrn} enrolled successfully.`,
      data: student,
    };
  }

  @Put(':id')
  async updateStudent(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const student = await this.studentsService.update(id, body, req?.user?.id);
    return {
      success: true,
      message: 'Student record updated successfully.',
      data: student,
    };
  }

  @Delete(':id')
  async deleteStudent(@Param('id') id: string, @Req() req: any) {
    const result = await this.studentsService.delete(id, req?.user?.id);
    return result;
  }

  @Post('bulk-import')
  async bulkImport(@Body() body: { schoolId?: string; records: any[] }, @Req() req: any) {
    const schoolId = body.schoolId || '11111111-1111-1111-1111-111111111111';
    const result = await this.studentsService.bulkImport(schoolId, body.records || [], req?.user?.id);
    return result;
  }
}
