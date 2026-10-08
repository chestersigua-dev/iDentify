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
exports.KioskController = void 0;
const common_1 = require("@nestjs/common");
const kiosk_service_1 = require("./kiosk.service");
let KioskController = class KioskController {
    constructor(kioskService) {
        this.kioskService = kioskService;
    }
    async scanToken(body, req) {
        if (!body.tokenUid) {
            throw new common_1.BadRequestException('Token UID (RFID or Barcode) is required.');
        }
        const schoolId = body.schoolId || '11111111-1111-1111-1111-111111111111';
        const result = await this.kioskService.processScan({ ...body, schoolId }, req.ip);
        return result;
    }
};
exports.KioskController = KioskController;
__decorate([
    (0, common_1.Post)('scan'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], KioskController.prototype, "scanToken", null);
exports.KioskController = KioskController = __decorate([
    (0, common_1.Controller)('api/kiosk'),
    __metadata("design:paramtypes", [kiosk_service_1.KioskService])
], KioskController);
//# sourceMappingURL=kiosk.controller.js.map