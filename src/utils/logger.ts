/**
 * Logger utilitaire - N'affiche les logs qu'en mode développement
 * Évite les fuites d'informations en production et améliore les performances
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

// Type pour les arguments de log (accepte tout type intentionnellement)
type LogArgs = unknown[];

interface LoggerConfig {
  enabled: boolean;
  prefix: string;
  showTimestamp: boolean;
}

const defaultConfig: LoggerConfig = {
  enabled: __DEV__,
  prefix: '[Fakt]',
  showTimestamp: false,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private formatMessage(level: LogLevel, args: LogArgs): LogArgs {
    if (!this.config.showTimestamp) {
      return args;
    }
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    return [`[${timestamp}]`, ...args];
  }

  private shouldLog(): boolean {
    return this.config.enabled;
  }

  log(...args: LogArgs): void {
    if (this.shouldLog()) {
      console.log(...this.formatMessage('log', args));
    }
  }

  info(...args: LogArgs): void {
    if (this.shouldLog()) {
      console.info(...this.formatMessage('info', args));
    }
  }

  warn(...args: LogArgs): void {
    if (this.shouldLog()) {
      console.warn(...this.formatMessage('warn', args));
    }
  }

  error(...args: LogArgs): void {
    // Les erreurs sont toujours loggées
    if (this.shouldLog()) {
      console.error(...this.formatMessage('error', args));
    }

    // En production, envoyer à Sentry
    if (!__DEV__) {
      // Import dynamique pour éviter les problèmes de circular dependency
      import('../services/errorService').then(({ errorService }) => {
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        if (args[0] instanceof Error) {
          errorService.captureException(args[0]);
        } else {
          errorService.captureMessage(message, 'error');
        }
      }).catch(() => {
        // Ignorer si le service n'est pas disponible
      });
    }
  }

  debug(...args: LogArgs): void {
    if (this.shouldLog()) {
      console.debug(...this.formatMessage('debug', args));
    }
  }

  /**
   * Log groupé pour les opérations complexes
   */
  group(label: string): void {
    if (this.shouldLog()) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      console.groupEnd();
    }
  }

  /**
   * Log avec mesure de temps
   */
  time(label: string): void {
    if (this.shouldLog()) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog()) {
      console.timeEnd(label);
    }
  }
}

// Instance par défaut
const logger = new Logger();

// Export des fonctions pour usage direct
export const log = (...args: LogArgs) => logger.log(...args);
export const info = (...args: LogArgs) => logger.info(...args);
export const warn = (...args: LogArgs) => logger.warn(...args);
export const error = (...args: LogArgs) => logger.error(...args);
export const debug = (...args: LogArgs) => logger.debug(...args);

export default logger;
