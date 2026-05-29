import 'dotenv/config';
import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';

dns.setDefaultResultOrder('ipv4first');

async function configureApp(app: any, enableWebSockets = true) {
  app.use(
    helmet.default({
      // Swagger UI uses inline scripts/styles and can appear as a blank page
      // when Helmet's default CSP is enabled.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  if (enableWebSockets) {
    app.useWebSocketAdapter(new IoAdapter(app));
  }

  const config = new DocumentBuilder()
    .setTitle('Gengig API')
    .setDescription('Gengig — Freelancing Platform for Teenagers')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  await configureApp(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

let cachedExpressApp: ReturnType<typeof express> | null = null;

export const handler = async (req: any, res: any) => {
  try {
    if (!cachedExpressApp) {
      const expressApp = express();
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
        { bodyParser: false },
      );
      await configureApp(app, false);
      await app.init();
      cachedExpressApp = expressApp;
    }

    return cachedExpressApp(req as Request, res as Response);
  } catch (error: any) {
    const message = error?.message || 'Unknown server initialization error';
    console.error('Vercel handler bootstrap error:', error);
    return res.status(500).json({
      message: 'Server initialization failed',
      error: message,
    });
  }
};

if (process.env.VERCEL !== '1') {
  bootstrap().catch((error) => {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  });
}
