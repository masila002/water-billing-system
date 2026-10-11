import 'reflect-metadata';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import helmet from 'helmet';
import { AppModule } from './app.module';

const DEMO_ENV_FILE = resolve(__dirname, '..', '..', '.env');
if (existsSync(DEMO_ENV_FILE)) {
  config({ path: DEMO_ENV_FILE });
}

const REAL_DB_MARKERS = [':5434', '/majibill', 'majibill-postgres'];

function resolveDemoDatabaseUrl(): string {
  const url = process.env.DEMO_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      `Demo backend requires DEMO_DATABASE_URL in ${DEMO_ENV_FILE} (see demo-app/.env.example). ` +
        'The root .env is never read by the demo.',
    );
  }
  const hit = REAL_DB_MARKERS.find((marker) => url.includes(marker));
  if (hit) {
    throw new Error(
      `Refusing to boot demo backend against the real database (matched '${hit}'). ` +
        'Use fictional demo data only.',
    );
  }
  return url;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.enableCors({ origin: allowedOrigins });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4001);
  process.env.DATABASE_URL = resolveDemoDatabaseUrl();
  await app.listen(port, process.env.HOST ?? '127.0.0.1');
}

void bootstrap();
