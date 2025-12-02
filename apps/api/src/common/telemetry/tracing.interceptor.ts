import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { trace, SpanStatusCode, context, SpanKind } from '@opentelemetry/api';

const tracer = trace.getTracer('fitquest-api');

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = ctx.switchToHttp().getRequest();
    const handler = ctx.getHandler();
    const controller = ctx.getClass();

    const spanName = `${controller.name}.${handler.name}`;

    return new Observable((subscriber) => {
      const span = tracer.startSpan(
        spanName,
        {
          kind: SpanKind.SERVER,
          attributes: {
            'http.method': request.method,
            'http.url': request.url,
            'http.route': request.route?.path,
            'controller.name': controller.name,
            'handler.name': handler.name,
            'user.id': request.user?.sub,
          },
        },
        context.active(),
      );

      context.with(trace.setSpan(context.active(), span), () => {
        next
          .handle()
          .pipe(
            tap((response) => {
              span.setStatus({ code: SpanStatusCode.OK });
              span.setAttribute('http.status_code', 200);
              span.end();
            }),
            catchError((error) => {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              span.setAttribute('error', true);
              span.setAttribute('error.type', error.name);
              span.setAttribute('error.message', error.message);
              span.setAttribute('http.status_code', error.status || 500);
              span.recordException(error);
              span.end();
              throw error;
            }),
          )
          .subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
      });
    });
  }
}
