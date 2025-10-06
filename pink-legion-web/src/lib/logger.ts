export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
    error?: Error,
    userId?: string
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      data,
      error,
      userId,
      sessionId: this.getSessionId(),
    };
  }

  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('logger-session-id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('logger-session-id', sessionId);
      }
      return sessionId;
    }
    return 'server-session';
  }

  private formatLogMessage(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level];
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `[${entry.timestamp}] ${levelStr}${contextStr}: ${entry.message}${dataStr}`;
  }

  private logToConsole(entry: LogEntry): void {
    const message = this.formatLogMessage(entry);
    
    if (this.isDevelopment) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(message, entry.data);
          break;
        case LogLevel.INFO:
          console.info(message, entry.data);
          break;
        case LogLevel.WARN:
          console.warn(message, entry.data);
          break;
        case LogLevel.ERROR:
          console.error(message, entry.error || entry.data);
          break;
        default:
          console.log(message, entry.data);
      }
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    // Em produção, enviar logs para serviço externo
    if (process.env.NODE_ENV === 'production') {
      try {
        // Implementar envio para serviço de logging (ex: LogRocket, Sentry, etc.)
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // });
        console.log('Log entry would be sent to remote service:', entry.message);
      } catch (error) {
        console.error('Failed to send log to remote service:', error);
      }
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: unknown,
    error?: Error,
    userId?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, data, error, userId);
    this.logToConsole(entry);
    this.logToRemote(entry);
  }

  debug(message: string, context?: string, data?: unknown, userId?: string): void {
    this.log(LogLevel.DEBUG, message, context, data, undefined, userId);
  }

  info(message: string, context?: string, data?: unknown, userId?: string): void {
    this.log(LogLevel.INFO, message, context, data, undefined, userId);
  }

  warn(message: string, context?: string, data?: unknown, userId?: string): void {
    this.log(LogLevel.WARN, message, context, data, undefined, userId);
  }

  error(message: string, error?: Error, context?: string, data?: unknown, userId?: string): void {
    this.log(LogLevel.ERROR, message, context, data, error, userId);
  }

  // Métodos específicos para diferentes contextos
  auth(message: string, data?: unknown, userId?: string): void {
    this.info(message, 'AUTH', data, userId);
  }

  authError(message: string, error?: Error, data?: unknown, userId?: string): void {
    this.error(message, error, 'AUTH', data, userId);
  }

  supabase(message: string, data?: unknown, userId?: string): void {
    this.debug(message, 'SUPABASE', data, userId);
  }

  supabaseError(message: string, error?: Error, data?: unknown, userId?: string): void {
    this.error(message, error, 'SUPABASE', data, userId);
  }

  api(message: string, data?: unknown, userId?: string): void {
    this.info(message, 'API', data, userId);
  }

  apiError(message: string, error?: Error, data?: unknown, userId?: string): void {
    this.error(message, error, 'API', data, userId);
  }

  ui(message: string, data?: unknown, userId?: string): void {
    this.debug(message, 'UI', data, userId);
  }

  performance(message: string, data?: unknown): void {
    this.info(message, 'PERFORMANCE', data);
  }
}

// Instância singleton do logger
export const logger = new Logger();

// Hook para usar o logger em componentes React
export function useLogger() {
  return logger;
}

// Configurar tratamento global de erros
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logger.error('Global error caught', event.error, 'GLOBAL', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', event.reason, 'GLOBAL', {
        promise: event.promise,
      });
    });
  }
}