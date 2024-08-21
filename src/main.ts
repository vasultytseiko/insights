import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const bootstrap = async () => {
  const PORT = process.env.PORT || 8080;
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Analitics example')
    .setDescription('The Analitics API')
    .setVersion('1.0')
    .addTag('analitics')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(cookieParser());
  if (process.env.NODE_ENV === 'development') {
    app.enableCors({ origin: 'http://localhost:8000', credentials: true });
  }
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({ origin: 'https://socialytix.co', credentials: true });
  }
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(PORT, () =>
    console.log('---------server started on PORT---', PORT),
  );
};
bootstrap();
