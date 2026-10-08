import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  Headers,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { SchoolsService, CreateSchoolDto, PurgeSchoolDto } from './schools.service';

@Controller('api/schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  async getAllSchools() {
    const schools = await this.schoolsService.findAll();
    return {
      success: true,
      count: schools.length,
      data: schools,
    };
  }

  @Get(':identifier')
  async getSchool(@Param('identifier') identifier: string) {
    let school;
    try {
      school = await this.schoolsService.findBySlug(identifier);
    } catch {
      school = await this.schoolsService.findById(identifier);
    }
    return {
      success: true,
      data: school,
    };
  }

  @Post()
  async createSchool(@Body() dto: CreateSchoolDto, @Req() req: any) {
    const school = await this.schoolsService.create(dto, req?.user?.id);
    return {
      success: true,
      message: 'School successfully provisioned.',
      data: school,
    };
  }

  @Put(':id')
  async updateSchool(
    @Param('id') id: string,
    @Body() body: any,
    @Headers('x-user-role') headerRole: string,
    @Query('actorRole') queryRole: string,
    @Req() req: any,
  ) {
    const actorRole = req?.user?.role || headerRole || queryRole || body?.actorRole || 'PRINCIPAL';
    if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'PRINCIPAL') {
      throw new ForbiddenException(
        'Only Super Administrator and School Head (Principal) are authorized to modify institutional identity and accreditation details.',
      );
    }
    const updated = await this.schoolsService.update(id, body, req?.user?.id, actorRole);
    return {
      success: true,
      message: 'School details updated successfully.',
      data: updated,
    };
  }

  @Delete(':id/purge-cascade')
  async purgeSchool(
    @Param('id') id: string,
    @Body() dto: PurgeSchoolDto,
    @Headers('x-user-role') headerRole: string,
    @Req() req: any,
  ) {
    const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
    if (actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Exclusive operation: Only Super Administrator can perform cascading school deletion.');
    }
    const adminId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
    const result = await this.schoolsService.purgeSchoolCascade(
      id,
      dto,
      adminId,
      req.ip,
    );
    return result;
  }

  @Post('purge-all-data')
  async purgeAllDataExceptSuperAdmin(
    @Body() body: any,
    @Headers('x-user-role') headerRole: string,
    @Req() req: any,
  ) {
    const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
    const actorId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
    return await this.schoolsService.purgeAllDataExceptSuperAdmin(
      actorRole,
      actorId,
      req.ip,
    );
  }

  @Post('factory-reset')
  async factoryResetSystemToZero(
    @Body() body: any,
    @Headers('x-user-role') headerRole: string,
    @Req() req: any,
  ) {
    const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
    const actorId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
    return await this.schoolsService.factoryResetSystemToZero(
      actorRole,
      actorId,
      req.ip,
    );
  }

  @Post('prepare-launch')
  async prepareForLaunch(
    @Body() body: any,
    @Headers('x-user-role') headerRole: string,
    @Req() req: any,
  ) {
    const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
    const actorId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
    return await this.schoolsService.prepareForLaunch(
      actorRole,
      actorId,
      req.ip,
    );
  }
}
