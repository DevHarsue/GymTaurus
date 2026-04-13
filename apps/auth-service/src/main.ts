import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
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
