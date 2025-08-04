import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Plink Logistics Courier Service API')
    .setDescription(
      `
      A comprehensive courier service API that enables users to send and track parcels with real-time notifications.
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile endpoints')
    .addTag('Parcels', 'Parcel creation, tracking, and management endpoints')
    .addTag(
      'Parcel Requests',
      'Parcel request submission and approval workflow',
    )
    .addTag('Maps', 'Geocoding, distance calculation, and map data endpoints')
    .addTag('Email', 'Email notification and template endpoints')
    .addTag('Contact Messages', 'User contact messages and admin replies')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Plink Logistics API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
    },
  });

  const port = Number(configService.get('PORT')) || 3000;
  await app.listen(port);

  logger.log(`Backend API is running on: http://localhost:${port}/api/v1`);
  logger.log(
    `Swagger Documentation is available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
