"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KioskModule = void 0;
const common_1 = require("@nestjs/common");
const kiosk_service_1 = require("./kiosk.service");
const kiosk_controller_1 = require("./kiosk.controller");
const database_service_1 = require("../../config/database.service");
const students_module_1 = require("../students/students.module");
const sms_module_1 = require("../sms/sms.module");
const audit_service_1 = require("../audit/audit.service");
let KioskModule = class KioskModule {
};
exports.KioskModule = KioskModule;
exports.KioskModule = KioskModule = __decorate([
    (0, common_1.Module)({
        imports: [students_module_1.StudentsModule, sms_module_1.SmsModule],
        controllers: [kiosk_controller_1.KioskController],
        providers: [kiosk_service_1.KioskService, database_service_1.DatabaseService, audit_service_1.AuditService],
        exports: [kiosk_service_1.KioskService],
    })
], KioskModule);
//# sourceMappingURL=kiosk.module.js.map