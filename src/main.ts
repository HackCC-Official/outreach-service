import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';

// Load environment variables from .env file

/**
 * Bootstrap the NestJS application with Swagger documentation
 */
async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);

  app.setGlobalPrefix(
    process.env.NODE_ENV === 'production' ? 'outreach-service' : '',
  );

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw errors when non-whitelisted values are provided
      transformOptions: {
        enableImplicitConversion: true, // Automatically transform query parameters
      },
    }),
  );

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Outreach Service API')
    .setDescription('API documentation for the Outreach Service')
    .setVersion('1.0.8')
    .addBearerAuth()
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });

  console.log(process.env.NODE_ENV);

  SwaggerModule.setup(
    process.env.NODE_ENV === 'production' ? 'outreach-service/docs' : 'docs',
    app,
    documentFactory,
  );

  await app.listen(3000);
}

bootstrap().catch((error: Error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
