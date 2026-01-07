import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'it';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

interface DeepLResponse {
  translations: Array<{
    text: string;
  }>;
}

class DeepLTranslateService {
  private cache: TranslationCache = {};
  private cacheKey = '@deepl_translation_cache';
  private cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 jours
  private apiKey = ENV.DEEPL_API_KEY; // Chargée depuis les variables d'environnement
  private endpoint = 'https://api-free.deepl.com/v2/translate';

  constructor() {
    this.loadCache();
  }

  /**
   * Traduit un email personnalisé en utilisant DeepL
   */
  async translateEmailText(text: string, fromLang: SupportedLanguage, toLang: SupportedLanguage): Promise<string> {
    if (fromLang === toLang) return text;

    console.log(`🌍 Traduction DeepL ${fromLang} → ${toLang}:`, text.substring(0, 50) + '...');

    // Protéger les variables Fakt
    const protectedText = this.protectVariables(text);
    
    try {
      const translatedText = await this.translateText(protectedText, fromLang, toLang);
      const finalText = this.restoreVariables(translatedText);
      console.log('✅ Traduction DeepL réussie');
      return finalText;
    } catch (error) {
      console.error('❌ Erreur traduction DeepL:', error);
      return text; // Retourner le texte original en cas d'erreur
    }
  }

  /**
   * Traduit un texte en utilisant l'API DeepL
   */
  private async translateText(text: string, fromLang: SupportedLanguage, toLang: SupportedLanguage): Promise<string> {
    const cacheKey = `${text}_${fromLang}_${toLang}`;
    
    // Vérifier le cache
    const cached = this.cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Traduction depuis le cache DeepL');
      return cached.translation;
    }

    // Mapper les codes de langue pour DeepL
    const langMap: Record<SupportedLanguage, string> = {
      'fr': 'FR',
      'en': 'EN',
      'es': 'ES',
      'de': 'DE',
      'it': 'IT'
    };

    const fromCode = langMap[fromLang];
    const toCode = langMap[toLang];

    if (!fromCode || !toCode) {
      throw new Error(`Langue non supportée: ${fromLang} → ${toLang}`);
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          source_lang: fromCode,
          target_lang: toCode,
          preserve_formatting: true,
          tag_handling: 'xml'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API DeepL:', response.status, errorText);
        throw new Error(`Erreur API DeepL: ${response.status} - ${errorText}`);
      }

      const data: DeepLResponse = await response.json();
      
      if (!data || !data.translations || data.translations.length === 0) {
        throw new Error('Réponse invalide de DeepL');
      }

      const translatedText = data.translations[0].text;

      // Sauvegarder en cache
      this.cache[cacheKey] = {
        translation: translatedText,
        timestamp: Date.now(),
      };
      this.saveCache();

      return translatedText;
    } catch (error) {
      console.error('Erreur lors de l\'appel à DeepL:', error);
      throw error;
    }
  }

  /**
   * Protège TOUTES les variables entre accolades {} pour éviter qu'elles soient traduites
   * Et préserve les espaces avant/après les variables
   */
  private protectVariables(text: string): string {
    // Trouver toutes les variables entre accolades avec espaces optionnels avant/après
    const variablePattern = /(\s*)(\{[^}]+\})(\s*)/g;
    const matches: Array<{full: string, before: string, variable: string, after: string}> = [];

    let match;
    while ((match = variablePattern.exec(text)) !== null) {
      matches.push({
        full: match[0],
        before: match[1],
        variable: match[2],
        after: match[3]
      });
    }

    let protectedText = text;
    matches.forEach((m, index) => {
      // Utiliser un placeholder unique qui préserve les espaces
      const placeholder = `${m.before}__VAR${index}__${m.after}`;
      // Échapper les caractères spéciaux pour le regex
      const escapedFull = m.full.replace(/[{}]/g, '\\$&').replace(/\s/g, '\\s');
      protectedText = protectedText.replace(new RegExp(escapedFull, 'g'), placeholder);
    });

    // Stocker les variables originales pour la restauration
    (this as any)._protectedVariables = matches.map(m => m.variable);

    return protectedText;
  }

  /**
   * Restore les variables Fakt après traduction
   */
  private restoreVariables(text: string): string {
    const variables = (this as any)._protectedVariables || [];

    let restoredText = text;
    variables.forEach((variable: string, index: number) => {
      // Le placeholder avec ses espaces préservés
      const placeholder = `__VAR${index}__`;
      // Remplacer en gardant les espaces qui étaient dans le placeholder
      restoredText = restoredText.replace(new RegExp(placeholder, 'g'), variable);
    });

    // Nettoyer les variables stockées
    delete (this as any)._protectedVariables;

    return restoredText;
  }

  /**
   * Charge le cache depuis AsyncStorage
   */
  private async loadCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem(this.cacheKey);
      if (cacheData) {
        this.cache = JSON.parse(cacheData);
      }
    } catch (error) {
      console.error('Erreur chargement cache traduction DeepL:', error);
    }
  }

  /**
   * Sauvegarde le cache dans AsyncStorage
   */
  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Erreur sauvegarde cache traduction DeepL:', error);
    }
  }

  /**
   * Obtient les statistiques d'utilisation
   */
  getUsageStats(): { cachedTranslations: number; totalCharacters: number } {
    const entries = Object.entries(this.cache);
    const totalCharacters = entries.reduce((sum, [key]) => {
      const text = key.split('_')[0];
      return sum + text.length;
    }, 0);

    return {
      cachedTranslations: entries.length,
      totalCharacters,
    };
  }

  /**
   * Vérifie si une langue est supportée
   */
  isLanguageSupported(lang: string): lang is SupportedLanguage {
    return ['fr', 'en', 'es', 'de', 'it'].includes(lang);
  }

  /**
   * Test basique du service
   */
  async testConnection(): Promise<boolean> {
    try {
      const testText = 'Bonjour, je suis propriétaire et voici la facture pour votre séjour. Merci et cordialement';
      const result = await this.translateText(testText, 'fr', 'en');
      console.log('✅ Test traduction DeepL réussi:', result);
      return result.length > 0 && result !== testText;
    } catch (error) {
      console.error('❌ Test traduction DeepL échoué:', error);
      return false;
    }
  }

  /**
   * Nettoie le cache expiré
   */
  async cleanExpiredCache(): Promise<void> {
    const now = Date.now();
    const validEntries: TranslationCache = {};

    Object.entries(this.cache).forEach(([key, value]) => {
      if (now - value.timestamp < this.cacheExpiry) {
        validEntries[key] = value;
      }
    });

    this.cache = validEntries;
    await this.saveCache();
    console.log('🧹 Cache DeepL nettoyé');
  }
}

export default new DeepLTranslateService();