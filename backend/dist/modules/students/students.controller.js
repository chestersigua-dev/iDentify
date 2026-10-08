"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsController = void 0;
const common_1 = require("@nestjs/common");
const students_service_1 = require("./students.service");
let StudentsController = class StudentsController {
    constructor(studentsService) {
        this.studentsService = studentsService;
    }
    async getStudents(schoolId, sectionId, gradeLevel) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const students = await this.studentsService.findAll(sId, sectionId, gradeLevel);
        return {
            success: true,
            count: students.length,
            data: students,
        };
    }
    async getStudentByLrn(lrn, schoolId) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const student = await this.studentsService.findByLrn(sId, lrn);
        return {
            success: true,
            data: student,
        };
    }
    async assignRfid(dto, schoolId, req) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const token = await this.studentsService.assignRfidToken(sId, dto, req?.user?.id);
        return {
            success: true,
            message: `RFID Tag '${dto.tokenUid}' paired to LRN ${dto.lrn} successfully.`,
            data: token,
        };
    }
    async createStudent(body, req) {
        const schoolId = body.schoolId || '11111111-1111-1111-1111-111111111111';
        const student = await this.studentsService.create(schoolId, body, req?.user?.id);
        return {
            success: true,
            message: `Student with LRN ${body.lrn} enrolled successfully.`,
            data: student,
        };
    }
    async updateStudent(id, body, req) {
        const student = await this.studentsService.update(id, body, req?.user?.id);
        return {
            success: true,
            message: 'Student record updated successfully.',
            data: student,
        };
    }
    async deleteStudent(id, req) {
        const result = await this.studentsService.delete(id, req?.user?.id);
        return result;
    }
    async bulkImport(body, req) {
        const schoolId = body.schoolId || '11111111-1111-1111-1111-111111111111';
        const result = await this.studentsService.bulkImport(schoolId, body.records || [], req?.user?.id);
        return result;
    }
};
exports.StudentsController = StudentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('sectionId')),
    __param(2, (0, common_1.Query)('gradeLevel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Get)('lrn/:lrn'),
    __param(0, (0, common_1.Param)('lrn')),
    __param(1, (0, common_1.Query)('schoolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "getStudentByLrn", null);
__decorate([
    (0, common_1.Post)('assign-rfid'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('schoolId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "assignRfid", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "deleteStudent", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudentsController.prototype, "bulkImport", null);
exports.StudentsController = StudentsController = __decorate([
    (0, common_1.Controller)('api/students'),
    __metadata("design:paramtypes", [students_service_1.StudentsService])
], StudentsController);
//# sourceMappingURL=students.controller.js.map