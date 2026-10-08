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
exports.DepEdController = void 0;
const common_1 = require("@nestjs/common");
const deped_integration_service_1 = require("./deped-integration.service");
let DepEdController = class DepEdController {
    constructor(depedService) {
        this.depedService = depedService;
    }
    async getSchoolForm1(schoolId, sectionId) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const sf1 = await this.depedService.generateSF1(sId, sectionId);
        return {
            success: true,
            data: sf1,
        };
    }
    async getSchoolForm2(schoolId, sectionId, month) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const sf2 = await this.depedService.generateSF2(sId, sectionId, month);
        return {
            success: true,
            data: sf2,
        };
    }
    async getSchoolForm5(schoolId, sectionId) {
        const sId = schoolId || '11111111-1111-1111-1111-111111111111';
        const sf5 = await this.depedService.generateSF5(sId, sectionId);
        return {
            success: true,
            data: sf5,
        };
    }
    async syncLIS(body, req) {
        const sId = body.schoolId || '11111111-1111-1111-1111-111111111111';
        const result = await this.depedService.syncWithDepEdLIS({
            schoolId: sId,
            syncType: body.syncType || 'FULL',
            actorId: req?.user?.id,
        });
        return {
            success: true,
            data: result,
        };
    }
};
exports.DepEdController = DepEdController;
__decorate([
    (0, common_1.Get)('sf1'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DepEdController.prototype, "getSchoolForm1", null);
__decorate([
    (0, common_1.Get)('sf2'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('sectionId')),
    __param(2, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DepEdController.prototype, "getSchoolForm2", null);
__decorate([
    (0, common_1.Get)('sf5'),
    __param(0, (0, common_1.Query)('schoolId')),
    __param(1, (0, common_1.Query)('sectionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DepEdController.prototype, "getSchoolForm5", null);
__decorate([
    (0, common_1.Post)('sync-lis'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DepEdController.prototype, "syncLIS", null);
exports.DepEdController = DepEdController = __decorate([
    (0, common_1.Controller)('api/deped'),
    __metadata("design:paramtypes", [deped_integration_service_1.DepEdIntegrationService])
], DepEdController);
//# sourceMappingURL=deped.controller.js.map