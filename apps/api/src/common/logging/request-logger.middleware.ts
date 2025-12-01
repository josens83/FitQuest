import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from './logger.service';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new LoggerService();

  constructor() {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or extract correlation ID
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.correlationId = correlationId;
    req.startTime = Date.now();

    // Set correlation ID in response header
    res.setHeader('x-correlation-id', correlationId);

    // Log request
    this.logger.debug(`Incoming request`, {
      correlationId,
      method: req.method,
      path: req.originalUrl,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: (req as any).user?.id,
    });

    // Log response on finish
    res.on('finish', () => {
      const duration = Date.now() - (req.startTime || Date.now());

      this.logger.logRequest(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        {
          correlationId,
          userId: (req as any).user?.id,
          ip: req.ip,
          contentLength: res.get('content-length'),
        }
      );
    });

    next();
  }
}
