import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseExceptionFilter } from './common/filters/exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ResponseExceptionFilter());

  await app.listen(process.env.PORT ?? 8080);
}

void bootstrap();
