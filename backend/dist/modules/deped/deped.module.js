"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepEdModule = void 0;
const common_1 = require("@nestjs/common");
const deped_integration_service_1 = require("./deped-integration.service");
const deped_controller_1 = require("./deped.controller");
const database_service_1 = require("../../config/database.service");
const audit_service_1 = require("../audit/audit.service");
let DepEdModule = class DepEdModule {
};
exports.DepEdModule = DepEdModule;
exports.DepEdModule = DepEdModule = __decorate([
    (0, common_1.Module)({
        controllers: [deped_controller_1.DepEdController],
        providers: [deped_integration_service_1.DepEdIntegrationService, database_service_1.DatabaseService, audit_service_1.AuditService],
        exports: [deped_integration_service_1.DepEdIntegrationService],
    })
], DepEdModule);
//# sourceMappingURL=deped.module.js.map