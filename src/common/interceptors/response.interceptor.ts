import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, BackendRes<T>> {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<BackendRes<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        let res: T;
        let meta: Meta | undefined;

        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          const parsed = data as BackendRes<T>;
          res = parsed.data;
          meta = parsed.meta;
        } else {
          res = data as T;
        }

        return {
          status: 'success',
          path: request.url,
          statusCode: response.statusCode,
          data: res,
          meta,
        };
      }),
    );
  }
}
