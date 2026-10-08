"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookieParser = require("cookie-parser");
async function bootstrap() {
    const logger = new common_1.Logger('iDentifyBootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, X-School-Id, X-Requested-With',
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    logger.log(`iDentify DepEd SaaS Backend is running on: http://localhost:${port}`);
    logger.log(`SOC 2 Type 2 Tamper-Evident Ledger initialized with HMAC SHA-256 Chaining.`);
}
bootstrap();
//# sourceMappingURL=main.js.map