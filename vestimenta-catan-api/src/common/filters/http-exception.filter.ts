import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  requestId?: string;
}

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = this.generateRequestId();
    const { statusCode, message, error } = this.getErrorDetails(exception);

    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId,
    };

    // Log the error with context
    this.logError(exception, request, statusCode, requestId);

    response.status(statusCode).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode: status,
          message: exceptionResponse,
          error: HttpStatus[status] || 'Error',
        };
      }

      const responseObj = exceptionResponse as HttpExceptionResponse;
      return {
        statusCode: status,
        message: responseObj.message || exception.message,
        error: responseObj.error || HttpStatus[status] || 'Error',
      };
    }

    // Handle Prisma errors
    if (this.isPrismaError(exception)) {
      return this.handlePrismaError(exception);
    }

    // Handle unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      error: 'Internal Server Error',
    };
  }

  private isPrismaError(exception: unknown): boolean {
    if (typeof exception !== 'object' || exception === null) return false;
    const error = exception as { code?: string; name?: string };
    return (
      error.name === 'PrismaClientKnownRequestError' ||
      error.name === 'PrismaClientValidationError' ||
      (typeof error.code === 'string' && error.code.startsWith('P'))
    );
  }

  private handlePrismaError(exception: unknown): {
    statusCode: number;
    message: string;
    error: string;
  } {
    const error = exception as { code?: string; meta?: { target?: string[] } };

    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || 'campo';
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `El ${field} ya existe`,
        error: 'Conflict',
      };
    }

    if (error.code === 'P2025') {
      // Record not found
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Registro no encontrado',
        error: 'Not Found',
      };
    }

    if (error.code === 'P2003') {
      // Foreign key constraint violation
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Referencia inválida a otro registro',
        error: 'Bad Request',
      };
    }

    // Default database error
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error de base de datos',
      error: 'Database Error',
    };
  }

  private logError(
    exception: unknown,
    request: Request,
    statusCode: number,
    requestId: string,
  ): void {
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      statusCode,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId: (request as Request & { user?: { userId?: number } }).user
        ?.userId,
    };

    if (statusCode >= 500) {
      // Log full error details for server errors
      this.logger.error('Unhandled Exception', {
        ...logContext,
        exception:
          exception instanceof Error
            ? {
                name: exception.name,
                message: exception.message,
                stack: exception.stack,
              }
            : exception,
      });
    } else if (statusCode >= 400) {
      // Log warning for client errors
      this.logger.warn('Client Error', {
        ...logContext,
        message:
          exception instanceof HttpException
            ? exception.message
            : 'Unknown error',
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
