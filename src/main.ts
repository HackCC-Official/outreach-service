import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import rateLimit from 'express-rate-limit';

async function bootstrap(): Promise<void> {
  const app: INestApplication = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable the built-in body parser
  });
  const logger = new Logger('Bootstrap');

  // Apply custom body parser with increased limit
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Apply rate limiting - different limits for different endpoints
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // More lenient rate limit for email endpoints
  const emailLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: 'Too many email requests, please try again in a few minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply the general limiter to all requests
  app.use(generalLimiter);

  // Apply the more restrictive limiter only to email endpoints
  app.use('/emails', emailLimiter);

  app.setGlobalPrefix(
    ['production', 'development'].find((env) => env === process.env.NODE_ENV)
      ? 'outreach-service'
      : '',
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

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
      'access-token',
    )
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false });

  logger.log(`Environment: ${process.env.NODE_ENV}`);

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

  const port = 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}

bootstrap().catch((error: Error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
