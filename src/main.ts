import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseExceptionFilter } from './common/filters/exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ResponseExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
