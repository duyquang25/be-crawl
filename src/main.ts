import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import * as expressBasicAuth from 'express-basic-auth';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { AllExceptionFilter } from './common/exception/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.LOG_LEVEL.split(',') as LogLevel[],
  });

  if (process.env.NODE_ENV === 'dev') {
    app.enableCors();
  } else if (process.env.NODE_ENV === 'prod') {
    app.enableCors({
      origin: [process.env.SITE_ENABLE],
    });
  }
  app.setGlobalPrefix(process.env.GLOBAL_API_PREFIX);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionFilter(httpAdapter));
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix(process.env.GLOBAL_API_PREFIX);

  // Swagger
  if (process.env.NODE_ENV === 'dev') {
    app.use(
      ['/swagger'],
      expressBasicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER]: process.env.SWAGGER_PASSWORD,
        },
      })
    );
    const config = new DocumentBuilder()
      .setTitle('Crawler App')
      .setDescription('Crawler App')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const customOptions: SwaggerCustomOptions = {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'Crawler App',
    };
    SwaggerModule.setup('swagger', app, document, customOptions);
  }
  await app.listen(process.env.PORT);
}
bootstrap();
