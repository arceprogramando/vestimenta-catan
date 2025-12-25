import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Log on response finish
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const duration = Date.now() - startTime;

      const logData = {
        method,
        url: originalUrl,
        statusCode,
        contentLength,
        duration: `${duration}ms`,
        ip,
        userAgent,
      };

      // Log level based on status code
      if (statusCode >= 500) {
        this.logger.error('HTTP Request', logData);
      } else if (statusCode >= 400) {
        this.logger.warn('HTTP Request', logData);
      } else {
        this.logger.info('HTTP Request', logData);
      }
    });

    next();
  }
}
