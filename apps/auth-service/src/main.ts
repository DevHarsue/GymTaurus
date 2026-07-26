import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Acepta el prefijo /api que en local reescribe nginx, para poder
    // consumir el servicio directamente (p. ej. en Render) sin gateway.
    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.url.startsWith('/api/')) {
            req.url = req.url.slice(4);
        }
        next();
    });
    app.enableCors();
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('Auth Service')
        .setDescription('Taurus Gym — Authentication API')
        .setVersion('1.0')
        .addServer('/api')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('auth/docs', app, document);

    const port = Number(process.env.AUTH_SERVICE_PORT ?? 3000);
    await app.listen(port);
}
void bootstrap();
