"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("./config/database.service");
const audit_module_1 = require("./modules/audit/audit.module");
const schools_module_1 = require("./modules/schools/schools.module");
const auth_module_1 = require("./modules/auth/auth.module");
const students_module_1 = require("./modules/students/students.module");
const sms_module_1 = require("./modules/sms/sms.module");
const kiosk_module_1 = require("./modules/kiosk/kiosk.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const deped_module_1 = require("./modules/deped/deped.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const users_module_1 = require("./modules/users/users.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_module_1.AuditModule,
            schools_module_1.SchoolsModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            students_module_1.StudentsModule,
            sms_module_1.SmsModule,
            kiosk_module_1.KioskModule,
            attendance_module_1.AttendanceModule,
            deped_module_1.DepEdModule,
            analytics_module_1.AnalyticsModule,
        ],
        controllers: [],
        providers: [database_service_1.DatabaseService],
        exports: [database_service_1.DatabaseService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map