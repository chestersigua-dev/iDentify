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
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(
    @Query('schoolId') schoolId?: string,
    @Query('role') role?: string,
    @Query('excludeSuperAdmin') excludeSuperAdmin?: string,
  ) {
    const users = await this.usersService.findAll(
      schoolId || null,
      role || null,
      excludeSuperAdmin === 'true',
    );
    return {
      success: true,
      count: users.length,
      data: users,
    };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      success: true,
      data: user,
    };
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    const user = await this.usersService.create(dto, req?.user?.id);
    return {
      success: true,
      message: `User '${dto.username}' created successfully.`,
      data: user,
    };
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any,
  ) {
    const user = await this.usersService.update(id, dto, req?.user?.id);
    return {
      success: true,
      message: 'User profile updated successfully.',
      data: user,
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const result = await this.usersService.delete(id, req?.user?.id);
    return result;
  }
}
