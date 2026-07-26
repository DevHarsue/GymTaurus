import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Acepta el prefijo /api que en local reescribe nginx, para poder
    // consumir el servicio directamente (p. ej. en Render) sin gateway.
    // La app móvil llama /api/access/statistics/*, que aquí vive bajo
    // el controller 'statistics' (nginx hacía esta misma reescritura).
    app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.url.startsWith('/api/')) {
            req.url = req.url.slice(4);
        }
        if (req.url.startsWith('/access/statistics')) {
            req.url = req.url.replace('/access/statistics', '/statistics');
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
        .setTitle('Access Service')
        .setDescription('Taurus Gym - Access control API')
        .setVersion('1.0')
        .addServer('/api')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('access/docs', app, document);

    const port = Number(process.env.ACCESS_SERVICE_PORT ?? 3002);
    await app.listen(port);
}
void bootstrap();
