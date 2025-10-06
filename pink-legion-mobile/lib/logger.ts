export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  error?: Error;
  sessionId: string;
}

export type LogContext = 
  | 'AUTH' 
  | 'SUPABASE' 
  | 'API' 
  | 'UI' 
  | 'NAVIGATION'
  | 'PERFORMANCE'
  | 'NETWORK'
  | 'STORAGE'
  | 'GLOBAL'
  | 'PROMISE_REJECTION';

class MobileLogger {
  private sessionId: string;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite para evitar uso excessivo de memória
  private minLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandling();
  }

  private generateSessionId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandling(): void {
    // Capturar erros JavaScript não tratados (React Native específico)
    const globalAny = global as any;
    const originalHandler = globalAny.ErrorUtils?.getGlobalHandler();
    
    if (globalAny.ErrorUtils) {
      globalAny.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        this.error(`Global error caught: ${error.message}`, error, 'GLOBAL', {
          isFatal,
          stack: error.stack
        });
        
        // Chamar o handler original se existir
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Capturar promises rejeitadas não tratadas
    if (typeof global.addEventListener === 'function') {
      global.addEventListener('unhandledrejection', (event: any) => {
        this.error(
          `Unhandled Promise Rejection: ${event.reason}`,
          new Error(event.reason),
          'PROMISE_REJECTION'
        );
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private addLog(entry: LogEntry): void {
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift(); // Remove o log mais antigo
    }
    this.logs.push(entry);
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const levelStr = LogLevel[level];
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} [${levelStr}]${contextStr} ${message}`;
  }

  debug(message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context,
      data,
      sessionId: this.sessionId
    };

    this.addLog(entry);
    
    if (__DEV__) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context), data || '');
    }
  }

  info(message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context,
      data,
      sessionId: this.sessionId
    };

    this.addLog(entry);
    console.info(this.formatMessage(LogLevel.INFO, message, context), data || '');
  }

  warn(message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context,
      data,
      sessionId: this.sessionId
    };

    this.addLog(entry);
    console.warn(this.formatMessage(LogLevel.WARN, message, context), data || '');
  }

  error(message: string, error?: Error, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context,
      data: {
        ...data,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      },
      error,
      sessionId: this.sessionId
    };

    this.addLog(entry);
    console.error(this.formatMessage(LogLevel.ERROR, message, context), {
      error: error?.message,
      stack: error?.stack,
      data
    });
  }

  // Métodos específicos para contextos comuns
  auth(message: string, data?: any): void {
    this.info(message, 'AUTH', data);
  }

  authError(message: string, error?: Error, data?: any): void {
    this.error(message, error, 'AUTH', data);
  }

  supabase(message: string, data?: any): void {
    this.info(message, 'SUPABASE', data);
  }

  navigation(message: string, data?: any): void {
    this.info(message, 'NAVIGATION', data);
  }

  performance(message: string, data?: any): void {
    this.info(message, 'PERFORMANCE', data);
  }

  // Métodos utilitários
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Exportar logs para debugging ou envio para servidor
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Configurar nível mínimo de log
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Instância global do logger
export const logger = new MobileLogger();

// Função para logar operações do Supabase
export function logSupabaseOperation(table: string, operation: string, data?: any): void {
  logger.supabase(`${operation.toUpperCase()} operation on ${table}`, { 
    table, 
    operation, 
    data: operation === 'select' ? undefined : data 
  });
}