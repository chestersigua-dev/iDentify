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
exports.SchoolsController = void 0;
const common_1 = require("@nestjs/common");
const schools_service_1 = require("./schools.service");
let SchoolsController = class SchoolsController {
    constructor(schoolsService) {
        this.schoolsService = schoolsService;
    }
    async getAllSchools() {
        const schools = await this.schoolsService.findAll();
        return {
            success: true,
            count: schools.length,
            data: schools,
        };
    }
    async getSchool(identifier) {
        let school;
        try {
            school = await this.schoolsService.findBySlug(identifier);
        }
        catch {
            school = await this.schoolsService.findById(identifier);
        }
        return {
            success: true,
            data: school,
        };
    }
    async createSchool(dto, req) {
        const school = await this.schoolsService.create(dto, req?.user?.id);
        return {
            success: true,
            message: 'School successfully provisioned.',
            data: school,
        };
    }
    async updateSchool(id, body, headerRole, queryRole, req) {
        const actorRole = req?.user?.role || headerRole || queryRole || body?.actorRole || 'PRINCIPAL';
        if (actorRole !== 'SUPER_ADMIN' && actorRole !== 'PRINCIPAL') {
            throw new common_1.ForbiddenException('Only Super Administrator and School Head (Principal) are authorized to modify institutional identity and accreditation details.');
        }
        const updated = await this.schoolsService.update(id, body, req?.user?.id, actorRole);
        return {
            success: true,
            message: 'School details updated successfully.',
            data: updated,
        };
    }
    async purgeSchool(id, dto, headerRole, req) {
        const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
        if (actorRole !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Exclusive operation: Only Super Administrator can perform cascading school deletion.');
        }
        const adminId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
        const result = await this.schoolsService.purgeSchoolCascade(id, dto, adminId, req.ip);
        return result;
    }
    async purgeAllDataExceptSuperAdmin(body, headerRole, req) {
        const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
        const actorId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
        return await this.schoolsService.purgeAllDataExceptSuperAdmin(actorRole, actorId, req.ip);
    }
    async factoryResetSystemToZero(body, headerRole, req) {
        const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
        const actorId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
        return await this.schoolsService.factoryResetSystemToZero(actorRole, actorId, req.ip);
    }
    async prepareForLaunch(body, headerRole, req) {
        const actorRole = req?.user?.role || headerRole || 'SUPER_ADMIN';
        const actorId = req?.user?.id || '00000000-0000-0000-0000-000000000001';
        return await this.schoolsService.prepareForLaunch(actorRole, actorId, req.ip);
    }
};
exports.SchoolsController = SchoolsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "getAllSchools", null);
__decorate([
    (0, common_1.Get)(':identifier'),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "getSchool", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "createSchool", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Query)('actorRole')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "updateSchool", null);
__decorate([
    (0, common_1.Delete)(':id/purge-cascade'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-user-role')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "purgeSchool", null);
__decorate([
    (0, common_1.Post)('purge-all-data'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-user-role')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "purgeAllDataExceptSuperAdmin", null);
__decorate([
    (0, common_1.Post)('factory-reset'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-user-role')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "factoryResetSystemToZero", null);
__decorate([
    (0, common_1.Post)('prepare-launch'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-user-role')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SchoolsController.prototype, "prepareForLaunch", null);
exports.SchoolsController = SchoolsController = __decorate([
    (0, common_1.Controller)('api/schools'),
    __metadata("design:paramtypes", [schools_service_1.SchoolsService])
], SchoolsController);
//# sourceMappingURL=schools.controller.js.map