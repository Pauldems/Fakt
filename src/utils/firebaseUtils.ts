/**
 * Utilitaires pour Firebase
 */

// Type pour les objets génériques avec clés string
type GenericObject = Record<string, unknown>;

/**
 * Nettoie un objet en remplaçant les valeurs undefined par null ou une valeur par défaut
 * Firebase n'accepte pas les valeurs undefined
 */
export function cleanForFirebase<T extends GenericObject>(obj: T): T {
  const cleaned: GenericObject = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Remplacer undefined par null (accepté par Firebase)
      cleaned[key] = null;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Récursivement nettoyer les objets imbriqués
      cleaned[key] = cleanForFirebase(value as GenericObject);
    } else {
      // Garder la valeur telle quelle
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}

/**
 * Nettoie un objet en supprimant complètement les clés avec valeurs undefined
 */
export function removeUndefined<T extends GenericObject>(obj: T): Partial<T> {
  const cleaned: GenericObject = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Récursivement nettoyer les objets imbriqués
        cleaned[key] = removeUndefined(value as GenericObject);
      } else {
        // Garder la valeur telle quelle
        cleaned[key] = value;
      }
    }
  }

  return cleaned as Partial<T>;
}

/**
 * Convertit les valeurs null de Firebase en undefined pour TypeScript
 */
export function convertNullToUndefined<T extends GenericObject>(obj: T): T {
  const converted: GenericObject = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      // Convertir null en undefined
      converted[key] = undefined;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Récursivement convertir les objets imbriqués
      converted[key] = convertNullToUndefined(value as GenericObject);
    } else {
      // Garder la valeur telle quelle
      converted[key] = value;
    }
  }

  return converted as T;
}