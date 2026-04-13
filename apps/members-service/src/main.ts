import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const config = new DocumentBuilder()
        .setTitle('API de Miembros - GymTaurus')
        .setDescription('Servicio para la gestión de miembros, planes y suscripciones del gimnasio.')
        .setVersion('1.0')
        // Important: Add standard server path for Nginx rewriting logic
        .addServer('/api/')
        .addBearerAuth()
        .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    const port = Number(process.env.MEMBERS_SERVICE_PORT ?? 3001);
    await app.listen(port);
}
void bootstrap();
