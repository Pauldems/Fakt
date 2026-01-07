/**
 * Service centralisé pour la gestion et le reporting des erreurs
 * Utilise Sentry en production pour traquer les crashs et erreurs
 */

import * as Sentry from '@sentry/react-native';
import { ENV } from '../config/env';

interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

class ErrorService {
  private initialized = false;

  /**
   * Initialise Sentry (à appeler au démarrage de l'app)
   */
  init(): void {
    if (this.initialized) return;

    // Ne pas initialiser si pas de DSN ou en mode dev
    if (!ENV.SENTRY_DSN || ENV.SENTRY_DSN.includes('your-sentry-dsn')) {
      console.log('[ErrorService] Sentry non configuré - reporting désactivé');
      return;
    }

    try {
      Sentry.init({
        dsn: ENV.SENTRY_DSN,
        // Activer seulement en production
        enabled: !__DEV__,
        // Capturer 100% des erreurs
        tracesSampleRate: 1.0,
        // Envoyer les breadcrumbs pour le contexte
        enableAutoSessionTracking: true,
        // Ignorer certaines erreurs communes non critiques
        beforeSend: (event) => {
          // Filtrer les erreurs de réseau temporaires
          if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
            return null;
          }
          return event;
        },
      });

      this.initialized = true;
      console.log('[ErrorService] Sentry initialisé avec succès');
    } catch (error) {
      console.error('[ErrorService] Erreur initialisation Sentry:', error);
    }
  }

  /**
   * Capture une exception avec contexte
   */
  captureException(error: Error, context?: ErrorContext): void {
    console.error('[ErrorService] Exception capturée:', error.message);

    if (!this.initialized || __DEV__) {
      // En dev, juste logger
      if (context) {
        console.error('[ErrorService] Contexte:', context);
      }
      return;
    }

    Sentry.withScope((scope) => {
      if (context?.screen) {
        scope.setTag('screen', context.screen);
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureException(error);
    });
  }

  /**
   * Capture un message (pour les erreurs non-exceptions)
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'error', context?: ErrorContext): void {
    console.log(`[ErrorService] Message [${level}]:`, message);

    if (!this.initialized || __DEV__) {
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      if (context?.screen) {
        scope.setTag('screen', context.screen);
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }

      Sentry.captureMessage(message);
    });
  }

  /**
   * Définit l'utilisateur courant pour le contexte des erreurs
   */
  setUser(userId: string, email?: string, name?: string): void {
    if (!this.initialized) return;

    Sentry.setUser({
      id: userId,
      email,
      username: name,
    });
  }

  /**
   * Supprime l'utilisateur (déconnexion)
   */
  clearUser(): void {
    if (!this.initialized) return;
    Sentry.setUser(null);
  }

  /**
   * Ajoute un breadcrumb pour le contexte
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.initialized || __DEV__) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }

  /**
   * Wrapper pour les fonctions async avec capture d'erreur automatique
   */
  async wrapAsync<T>(
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.captureException(error as Error, context);
      return null;
    }
  }
}

export const errorService = new ErrorService();
export default errorService;
