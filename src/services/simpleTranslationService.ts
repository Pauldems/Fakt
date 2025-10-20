import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour les langues supportées
export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'it';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
  };
}

// Dictionnaire étendu de traductions pour emails personnalisés
const emailTranslations: Record<SupportedLanguage, Record<string, string>> = {
  fr: {
    // Mots de base
    'bonjour': 'bonjour', 'hello': 'bonjour', 'salut': 'salut',
    'facture': 'facture', 'séjour': 'séjour', 'mois': 'mois', 'année': 'année',
    'cordialement': 'cordialement', 'merci': 'merci', 'bien': 'bien',
  },
  en: {
    // Salutations
    'bonjour': 'hello', 'bonsoir': 'good evening', 'salut': 'hi',
    // Mots courants
    'je': 'I', 'suis': 'am', 'vous': 'you', 'votre': 'your', 'mes': 'my',
    'et': 'and', 'pour': 'for', 'dans': 'in', 'avec': 'with', 'sans': 'without',
    'très': 'very', 'bien': 'well', 'bon': 'good', 'mauvais': 'bad',
    // Email
    'facture': 'invoice', 'séjour': 'stay', 'mois': 'month', 'année': 'year',
    'propriétaire': 'owner', 'client': 'client', 'location': 'rental',
    'veuillez': 'please', 'trouver': 'find', 'ci-joint': 'attached',
    'merci': 'thank you', 'cordialement': 'best regards',
    // Verbes
    'avoir': 'have', 'être': 'be', 'faire': 'do', 'aller': 'go', 'venir': 'come',
    'voir': 'see', 'savoir': 'know', 'pouvoir': 'can', 'vouloir': 'want',
    // Temps
    'aujourd\'hui': 'today', 'demain': 'tomorrow', 'hier': 'yesterday',
    'maintenant': 'now', 'bientôt': 'soon', 'toujours': 'always',
    // Noms communs
    'maison': 'house', 'appartement': 'apartment', 'chambre': 'room',
    'ville': 'city', 'pays': 'country', 'adresse': 'address',
    'nom': 'name', 'prénom': 'first name', 'téléphone': 'phone',
  },
  es: {
    // Salutations
    'bonjour': 'hola', 'bonsoir': 'buenas tardes', 'salut': 'hola',
    // Mots courants
    'je': 'yo', 'suis': 'soy', 'vous': 'usted', 'votre': 'su', 'mes': 'mis',
    'et': 'y', 'pour': 'para', 'dans': 'en', 'avec': 'con', 'sans': 'sin',
    'très': 'muy', 'bien': 'bien', 'bon': 'bueno', 'mauvais': 'malo',
    // Email
    'facture': 'factura', 'séjour': 'estancia', 'mois': 'mes', 'année': 'año',
    'propriétaire': 'propietario', 'client': 'cliente', 'location': 'alquiler',
    'veuillez': 'por favor', 'trouver': 'encontrar', 'ci-joint': 'adjunto',
    'merci': 'gracias', 'cordialement': 'saludos cordiales',
    // Temps
    'aujourd\'hui': 'hoy', 'demain': 'mañana', 'hier': 'ayer',
    // Noms communs
    'maison': 'casa', 'appartement': 'apartamento', 'chambre': 'habitación',
    'ville': 'ciudad', 'pays': 'país', 'nom': 'nombre',
  },
  de: {
    // Salutations
    'bonjour': 'hallo', 'bonsoir': 'guten abend', 'salut': 'hallo',
    // Mots courants
    'je': 'ich', 'suis': 'bin', 'vous': 'sie', 'votre': 'ihr', 'mes': 'meine',
    'et': 'und', 'pour': 'für', 'dans': 'in', 'avec': 'mit', 'sans': 'ohne',
    'très': 'sehr', 'bien': 'gut', 'bon': 'gut', 'mauvais': 'schlecht',
    // Email
    'facture': 'rechnung', 'séjour': 'aufenthalt', 'mois': 'monat', 'année': 'jahr',
    'propriétaire': 'eigentümer', 'client': 'kunde', 'location': 'vermietung',
    'veuillez': 'bitte', 'trouver': 'finden', 'ci-joint': 'anbei',
    'merci': 'danke', 'cordialement': 'mit freundlichen grüßen',
    // Temps
    'aujourd\'hui': 'heute', 'demain': 'morgen', 'hier': 'gestern',
    // Noms communs
    'maison': 'haus', 'appartement': 'wohnung', 'chambre': 'zimmer',
    'ville': 'stadt', 'pays': 'land', 'nom': 'name',
  },
  it: {
    // Salutations
    'bonjour': 'ciao', 'bonsoir': 'buonasera', 'salut': 'ciao',
    // Mots courants
    'je': 'io', 'suis': 'sono', 'vous': 'voi', 'votre': 'vostro', 'mes': 'miei',
    'et': 'e', 'pour': 'per', 'dans': 'in', 'avec': 'con', 'sans': 'senza',
    'très': 'molto', 'bien': 'bene', 'bon': 'buono', 'mauvais': 'cattivo',
    // Email
    'facture': 'fattura', 'séjour': 'soggiorno', 'mois': 'mese', 'année': 'anno',
    'propriétaire': 'proprietario', 'client': 'cliente', 'location': 'affitto',
    'veuillez': 'per favore', 'trouver': 'trovare', 'ci-joint': 'allegato',
    'merci': 'grazie', 'cordialement': 'cordiali saluti',
    // Temps
    'aujourd\'hui': 'oggi', 'demain': 'domani', 'hier': 'ieri',
    // Noms communs
    'maison': 'casa', 'appartement': 'appartamento', 'chambre': 'camera',
    'ville': 'città', 'pays': 'paese', 'nom': 'nome',
  },
};

// Templates d'emails traduits pour les structures communes
const emailTemplates: Record<SupportedLanguage, { greeting: string, attachment: string, closing: string }> = {
  fr: {
    greeting: 'Bonjour',
    attachment: 'Veuillez trouver ci-joint la facture',
    closing: 'Cordialement'
  },
  en: {
    greeting: 'Hello',
    attachment: 'Please find attached the invoice',
    closing: 'Best regards'
  },
  es: {
    greeting: 'Hola',
    attachment: 'Adjunto encontrará la factura',
    closing: 'Saludos cordiales'
  },
  de: {
    greeting: 'Hallo',
    attachment: 'Anbei finden Sie die Rechnung',
    closing: 'Mit freundlichen Grüßen'
  },
  it: {
    greeting: 'Ciao',
    attachment: 'In allegato trovate la fattura',
    closing: 'Cordiali saluti'
  }
};

class SimpleTranslationService {
  private cache: TranslationCache = {};
  private cacheKey = '@simple_translation_cache';
  private cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 jours

  constructor() {
    this.loadCache();
  }

  /**
   * Traduit un email personnalisé en utilisant des patterns et dictionnaire
   */
  async translateEmailText(text: string, fromLang: SupportedLanguage, toLang: SupportedLanguage): Promise<string> {
    if (fromLang === toLang) return text;

    console.log(`🌍 Traduction simple ${fromLang} → ${toLang}:`, text.substring(0, 50) + '...');

    // Protéger les variables Fakt
    const protectedText = this.protectVariables(text);
    
    try {
      const translatedText = await this.translateText(protectedText, fromLang, toLang);
      const finalText = this.restoreVariables(translatedText);
      console.log('✅ Traduction réussie (simple)');
      return finalText;
    } catch (error) {
      console.error('❌ Erreur traduction simple:', error);
      return text; // Retourner le texte original en cas d'erreur
    }
  }

  /**
   * Traduit un texte en utilisant patterns et dictionnaire local amélioré
   */
  private async translateText(text: string, fromLang: SupportedLanguage, toLang: SupportedLanguage): Promise<string> {
    const cacheKey = `${text}_${fromLang}_${toLang}`;
    
    // Vérifier le cache
    const cached = this.cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('📋 Traduction depuis le cache');
      return cached.translation;
    }

    const translations = emailTranslations[toLang];
    const template = emailTemplates[toLang];

    // Préserver la structure originale (majuscules, ponctuation)
    let translatedText = text;

    // 1. Remplacer les expressions complètes d'abord (plus spécifiques)
    const phrases = [
      ['veuillez trouver ci-joint la facture', template.attachment],
      ['veuillez trouver ci-joint', 'please find attached'],
      ['en vous souhaitant bonne réception', 'wishing you good reception'],
      ['je me permets de', 'I allow myself to'],
      ['je vous remercie', 'I thank you'],
      ['dans l\'attente de', 'waiting for'],
      ['pour le mois de', translations['pour'] + ' the month of'],
    ];

    phrases.forEach(([french, translation]) => {
      if (typeof translation === 'string') {
        const regex = new RegExp(french, 'gi');
        translatedText = translatedText.replace(regex, translation);
      }
    });

    // 2. Remplacer les mots individuels en préservant la casse
    Object.entries(translations).forEach(([french, translation]) => {
      if (french.length > 2) { // Éviter les mots trop courts qui causent des erreurs
        // Regex pour mots complets avec préservation de casse
        const wordRegex = new RegExp(`\\b${french}\\b`, 'gi');
        translatedText = translatedText.replace(wordRegex, (match) => {
          // Préserver la casse du mot original
          if (match === match.toUpperCase()) {
            return translation.toUpperCase();
          } else if (match[0] === match[0].toUpperCase()) {
            return translation.charAt(0).toUpperCase() + translation.slice(1).toLowerCase();
          } else {
            return translation.toLowerCase();
          }
        });
      }
    });

    // 3. Corrections spécifiques selon la langue cible
    translatedText = this.applyLanguageSpecificRules(translatedText, toLang);

    // Sauvegarder en cache
    this.cache[cacheKey] = {
      translation: translatedText,
      timestamp: Date.now(),
    };
    this.saveCache();

    return translatedText;
  }

  /**
   * Applique des règles spécifiques selon la langue
   */
  private applyLanguageSpecificRules(text: string, toLang: SupportedLanguage): string {
    let result = text;

    switch (toLang) {
      case 'en':
        // Corrections anglaises
        result = result.replace(/\bI am\b/g, "I'm");
        result = result.replace(/\byou are\b/g, "you're");
        result = result.replace(/Hello,\s*$/gm, 'Hello,');
        break;
      
      case 'es':
        // Corrections espagnoles
        result = result.replace(/\bhola,\s*$/gim, 'Hola,');
        result = result.replace(/\bgracias,\s*$/gim, 'Gracias,');
        break;
      
      case 'de':
        // Corrections allemandes
        result = result.replace(/\bhallo,\s*$/gim, 'Hallo,');
        result = result.replace(/\bsie\b/gi, 'Sie'); // Vouvoiement en allemand
        break;
      
      case 'it':
        // Corrections italiennes
        result = result.replace(/\bciao,\s*$/gim, 'Ciao,');
        break;
    }

    return result;
  }


  /**
   * Protège les variables Fakt
   */
  private protectVariables(text: string): string {
    const variables = [
      '{VILLE}', '{NOM}', '{PRENOM}', 
      '{NOM-PROPRIETAIRE}', '{PRENOM-PROPRIETAIRE}', 
      '{MOIS}', '{ANNEE}'
    ];

    let protectedText = text;
    variables.forEach((variable, index) => {
      const placeholder = `XVARX${index}XVARX`;
      protectedText = protectedText.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), placeholder);
    });

    return protectedText;
  }

  /**
   * Restore les variables Fakt après traduction
   */
  private restoreVariables(text: string): string {
    const variables = [
      '{VILLE}', '{NOM}', '{PRENOM}', 
      '{NOM-PROPRIETAIRE}', '{PRENOM-PROPRIETAIRE}', 
      '{MOIS}', '{ANNEE}'
    ];

    let restoredText = text;
    variables.forEach((variable, index) => {
      const placeholder = `XVARX${index}XVARX`;
      restoredText = restoredText.replace(new RegExp(placeholder, 'g'), variable);
    });

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
      console.error('Erreur chargement cache traduction:', error);
    }
  }

  /**
   * Sauvegarde le cache dans AsyncStorage
   */
  private async saveCache(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Erreur sauvegarde cache traduction:', error);
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
      console.log('✅ Test traduction améliorée réussi:', result);
      return result.includes('Hello') || result.includes('invoice') || result.includes('stay');
    } catch (error) {
      console.error('❌ Test traduction améliorée échoué:', error);
      return false;
    }
  }
}

export default new SimpleTranslationService();