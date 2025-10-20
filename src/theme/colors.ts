// Système de couleurs moderne avec palette de bleus étendue

export const BlueColors = {
  // Palette de bleus principale
  blue50: '#F5F9FF',   // Bleu très clair pour backgrounds
  blue100: '#E3F2FD',  // Bleu clair pour surfaces
  blue200: '#BBDEFB',  // Bleu clair pour borders
  blue300: '#90CAF9',  // Bleu moyen clair
  blue400: '#42A5F5',  // Bleu moyen
  blue500: '#2196F3',  // Bleu standard
  blue600: '#1976D2',  // Bleu foncé
  blue700: '#1565C0',  // Bleu très foncé
  blue800: '#0D47A1',  // Bleu extra foncé
  blue900: '#001A40',  // Bleu maximum foncé
  
  // Couleurs spécifiques Fakt
  primary: '#003580',      // Bleu principal Booking (conservé)
  primaryLight: '#4A7FBF', // Version claire du primary
  primaryDark: '#001A40',  // Version foncée du primary
  secondary: '#0052cc',    // Bleu secondaire existant
};

export const NeutralColors = {
  // Gris modernes
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  black: '#000000',
};

export const RedColors = {
  // Palette de rouge pour les actions destructives
  red50: '#FFEBEE',
  red100: '#FFCDD2',
  red200: '#EF9A9A',
  red300: '#E57373',
  red400: '#EF5350',
  red500: '#F44336',
  red600: '#E53935',
  red700: '#D32F2F',
  red800: '#C62828',
  red900: '#B71C1C',
};

export const GreenColors = {
  // Palette de vert pour les succès
  green50: '#E8F5E8',
  green100: '#C8E6C9',
  green200: '#A5D6A7',
  green300: '#81C784',
  green400: '#66BB6A',
  green500: '#4CAF50',
  green600: '#43A047',
  green700: '#388E3C',
  green800: '#2E7D32',
  green900: '#1B5E20',
};

export const SemanticColors = {
  // Couleurs sémantiques
  success: GreenColors.green500,
  successLight: GreenColors.green100,
  warning: '#FF9800',
  warningLight: '#FFE0B2',
  error: RedColors.red500,
  errorLight: RedColors.red100,
  info: BlueColors.blue500,
  infoLight: BlueColors.blue100,
};

// Thème clair - Style facture
export const LightTheme = {
  // Backgrounds - Tons bleus inspirés de l'onglet facture
  background: {
    primary: BlueColors.blue50,       // Bleu très clair comme fond principal
    secondary: BlueColors.blue100,    // Bleu clair pour variations
    accent: BlueColors.blue200,       // Bleu plus prononcé pour accents
  },
  
  // Surfaces (cards, containers) - Style facture
  surface: {
    primary: NeutralColors.white,     // Blanc pur pour les cartes (contraste)
    secondary: BlueColors.blue50,     // Bleu très clair
    accent: BlueColors.blue100,       // Bleu clair pour accents
    elevated: NeutralColors.white,    // Blanc pour éléments élevés
  },
  
  // Textes - Style facture
  text: {
    primary: BlueColors.primaryDark,  // Bleu foncé pour texte principal (comme l'onglet)
    secondary: BlueColors.primary,    // Bleu principal pour texte secondaire
    tertiary: BlueColors.blue600,     // Bleu moyen pour texte tertiaire
    inverse: NeutralColors.white,     // Blanc pour texte inversé
    link: BlueColors.blue700,         // Bleu foncé pour liens
  },
  
  // Bordures - Tons bleus
  border: {
    light: BlueColors.blue200,        // Bordures bleu clair
    medium: BlueColors.blue300,       // Bordures bleu moyen
    strong: BlueColors.blue400,       // Bordures bleu prononcé
  },
  
  // Couleurs principales - Style facture exact
  primary: BlueColors.primary,        // #003580 - couleur principale de l'onglet
  primaryLight: BlueColors.primaryLight,
  primaryDark: BlueColors.primaryDark, // #001A40 - bleu très foncé de l'onglet
  secondary: BlueColors.secondary,
  
  // Gradients - Basés sur l'onglet facture
  gradients: {
    primary: [BlueColors.primaryDark, BlueColors.primary],  // Même que header
    header: [BlueColors.primaryDark, BlueColors.primary],   // Gradient de l'onglet facture
    accent: [BlueColors.primary, BlueColors.blue400],       // Variation du gradient facture
    subtle: [BlueColors.blue100, BlueColors.blue200],       // Version douce
  },
  
  // Status
  success: SemanticColors.success,
  warning: SemanticColors.warning,
  error: SemanticColors.error,
  info: SemanticColors.info,
  
  // Couleurs complètes accessibles
  colors: {
    ...BlueColors,
    ...RedColors,
    ...GreenColors,
    ...NeutralColors,
  },
};

export type Theme = typeof LightTheme;