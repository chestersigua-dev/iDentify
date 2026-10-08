import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('iDentifyBootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ limit: '25mb', extended: true }));
  app.use(cookieParser());
  app.enableCors({
    origin: true, // Allow dynamic origin for multi-tenant subdomains
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-School-Id, X-Requested-With, x-user-role, X-User-Role',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`iDentify DepEd SaaS Backend is running on: http://localhost:${port}`);
  logger.log(`SOC 2 Type 2 Tamper-Evident Ledger initialized with HMAC SHA-256 Chaining.`);
}
bootstrap();
