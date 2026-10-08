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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async recordClassroomCheck(dto, req) {
        const log = await this.attendanceService.recordClassroomAttendance(dto, req.ip);
        return {
            success: true,
            message: 'Attendance record submitted successfully.',
            data: log,
        };
    }
    async getRoster(sectionId, schoolId, date, subjectName) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const roster = await this.attendanceService.getSectionRosterAttendance(sId, sectionId, date, subjectName);
        return {
            success: true,
            count: roster.length,
            data: roster,
        };
    }
    async getStudentDiary(studentId, schoolId) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const logs = await this.attendanceService.getStudentAttendanceDiary(sId, studentId);
        return {
            success: true,
            count: logs.length,
            data: logs,
        };
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('classroom-check'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "recordClassroomCheck", null);
__decorate([
    (0, common_1.Get)('roster/:sectionId'),
    __param(0, (0, common_1.Param)('sectionId')),
    __param(1, (0, common_1.Query)('schoolId')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Query)('subjectName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getRoster", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Query)('schoolId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentDiary", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('api/attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map