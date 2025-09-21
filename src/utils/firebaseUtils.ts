/**
 * Utilitaires pour Firebase
 */

/**
 * Nettoie un objet en remplaçant les valeurs undefined par null ou une valeur par défaut
 * Firebase n'accepte pas les valeurs undefined
 */
export function cleanForFirebase<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Remplacer undefined par null (accepté par Firebase)
      (cleaned as any)[key] = null;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Récursivement nettoyer les objets imbriqués
      (cleaned as any)[key] = cleanForFirebase(value);
    } else {
      // Garder la valeur telle quelle
      (cleaned as any)[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Nettoie un objet en supprimant complètement les clés avec valeurs undefined
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned = {} as Partial<T>;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Récursivement nettoyer les objets imbriqués
        (cleaned as any)[key] = removeUndefined(value);
      } else {
        // Garder la valeur telle quelle
        (cleaned as any)[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Convertit les valeurs null de Firebase en undefined pour TypeScript
 */
export function convertNullToUndefined<T extends Record<string, any>>(obj: T): T {
  const converted = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      // Convertir null en undefined
      (converted as any)[key] = undefined;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Récursivement convertir les objets imbriqués
      (converted as any)[key] = convertNullToUndefined(value);
    } else {
      // Garder la valeur telle quelle
      (converted as any)[key] = value;
    }
  }
  
  return converted;
}