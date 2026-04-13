import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
