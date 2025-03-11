import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';

// Load environment variables from .env file

/**
 * Bootstrap the NestJS application with Swagger documentation
 */
async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix(
    ['production', 'development'].find((env) => env === process.env.NODE_ENV)
      ? 'outreach-service'
      : '',
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

  // Enable CORS for Swagger UI
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Outreach Service API')
    .setDescription('API documentation for the Outreach Service')
    .setVersion('1.0.8')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'access-token', // This is the key used for @ApiBearerAuth() decorator
    )
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });

  logger.log(`Environment: ${process.env.NODE_ENV}`);

  // Set up Swagger UI
  const docsPath = ['production', 'development'].find(
    (env) => env === process.env.NODE_ENV,
  )
    ? 'outreach-service/docs'
    : 'docs';

  SwaggerModule.setup(docsPath, app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      docExpansion: 'none',
      filter: true,
      withCredentials: true,
    },
  });

  logger.log(`Swagger documentation available at /${docsPath}`);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}

bootstrap().catch((error: Error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
