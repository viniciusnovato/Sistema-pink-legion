import { logger } from './logger';

export interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorInfo?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, true, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, true, context);
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, true, context);
  }
}

export function handleError(error: Error, context?: Record<string, unknown>): void {
  // Log do erro com stack trace completo
  logger.error(
    `Unhandled error: ${error.message}`,
    error,
    'ERROR_HANDLER',
    {
      ...context,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    }
  );

  // Se for um erro operacional conhecido, não precisamos fazer nada mais
  if (error instanceof AppError && error.isOperational) {
    return;
  }

  // Para erros não operacionais, podemos adicionar alertas ou notificações
  if (process.env.NODE_ENV === 'production') {
    // Aqui poderia enviar para serviços como Sentry, Bugsnag, etc.
    console.error('Critical error in production:', error);
  }
}

export function handleAsyncError<T extends (...args: unknown[]) => Promise<unknown> | unknown>(fn: T): T {
  return ((...args: unknown[]) => {
    const result = fn(...args);
    
    if (result && typeof result === 'object' && 'catch' in result && typeof result.catch === 'function') {
      return result.catch((error: Error) => {
        handleError(error, { function: fn.name, args });
        throw error;
      });
    }
    
    return result;
  }) as T;
}

// Hook para React Error Boundaries
export function logErrorBoundary(error: Error, errorInfo: ErrorInfo): void {
  logger.error(
    `React Error Boundary caught error: ${error.message}`,
    error,
    'REACT_ERROR_BOUNDARY',
    {
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  );
}

// Interceptar erros não capturados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    handleError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled_error'
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      {
        reason: event.reason,
        type: 'unhandled_rejection'
      }
    );
  });
}