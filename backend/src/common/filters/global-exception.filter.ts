import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errorCode: string;
    let details: Record<string, unknown> | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorCode = this.getErrorCode(status);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const respObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof respObj.message === 'string'
            ? respObj.message
            : exception.message;
        errorCode =
          typeof respObj.error === 'string'
            ? respObj.error
            : this.getErrorCode(status);
        details = respObj.details
          ? (respObj.details as Record<string, unknown>)
          : null;
      } else {
        message = exception.message;
        errorCode = this.getErrorCode(status);
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      errorCode = prismaError.errorCode;
      details = prismaError.details;
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_SERVER_ERROR';

      // Log the actual error for debugging
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_SERVER_ERROR';

      this.logger.error(
        `Unknown exception type: ${typeof exception}`,
        JSON.stringify(exception),
        'GlobalExceptionFilter',
      );
    }

    const errorResponse: {
      success: boolean;
      message: string;
      errorCode: string;
      statusCode: number;
      timestamp: string;
      path: string;
      method: string;
      details?: Record<string, unknown>;
      stack?: string;
    } = {
      success: false,
      message,
      errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' &&
        exception instanceof Error && {
          stack: exception.stack,
        }),
    };

    // Log error details
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      {
        errorCode,
        userAgent: request.get('User-Agent'),
        ip: request.ip,
        ...(details && { details }),
      },
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): {
    status: number;
    message: string;
    errorCode: string;
    details: Record<string, unknown> | null;
  } {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = error.meta?.target as string[];
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${field?.join(', ') || 'field'} already exists`,
          errorCode: 'DUPLICATE_RECORD',
          details: {
            fields: field,
            constraint: 'unique',
          },
        };
      }

      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          errorCode: 'RECORD_NOT_FOUND',
          details: {
            cause: error.meta?.cause,
          },
        };

      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference to related record',
          errorCode: 'FOREIGN_KEY_VIOLATION',
          details: {
            field: error.meta?.field_name,
          },
        };

      case 'P2011':
        // Null constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required field is missing',
          errorCode: 'NULL_CONSTRAINT_VIOLATION',
          details: {
            constraint: error.meta?.constraint,
          },
        };

      case 'P2012':
        // Missing required value
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Missing required value',
          errorCode: 'MISSING_REQUIRED_VALUE',
          details: {
            path: error.meta?.path,
          },
        };

      case 'P2014':
        // Relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid relation reference',
          errorCode: 'RELATION_VIOLATION',
          details: {
            relation: error.meta?.relation_name,
          },
        };

      case 'P1008':
        // Operation timeout
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Database operation timed out',
          errorCode: 'DATABASE_TIMEOUT',
          details: null,
        };

      case 'P1002':
        // Database unreachable
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database service unavailable',
          errorCode: 'DATABASE_UNAVAILABLE',
          details: null,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error occurred',
          errorCode: 'DATABASE_ERROR',
          details: {
            code: error.code,
            meta: error.meta,
          },
        };
    }
  }
}
