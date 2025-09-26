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
  
  // Couleurs spécifiques BookingFakt
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

// Thème clair
export const LightTheme = {
  // Backgrounds
  background: {
    primary: NeutralColors.gray50,
    secondary: NeutralColors.white,
    accent: BlueColors.blue50,
  },
  
  // Surfaces (cards, containers)
  surface: {
    primary: NeutralColors.white,
    secondary: BlueColors.blue50,
    accent: BlueColors.blue100,
    elevated: NeutralColors.white,
  },
  
  // Textes
  text: {
    primary: NeutralColors.gray900,
    secondary: NeutralColors.gray700,
    tertiary: NeutralColors.gray500,
    inverse: NeutralColors.white,
    link: BlueColors.primary,
  },
  
  // Bordures
  border: {
    light: NeutralColors.gray200,
    medium: NeutralColors.gray300,
    strong: NeutralColors.gray400,
  },
  
  // Couleurs principales
  primary: BlueColors.primary,
  primaryLight: BlueColors.primaryLight,
  primaryDark: BlueColors.primaryDark,
  secondary: BlueColors.secondary,
  
  // Gradients
  gradients: {
    primary: [BlueColors.primary, BlueColors.secondary],
    header: [BlueColors.primaryDark, BlueColors.primary],
    accent: [BlueColors.primaryLight, BlueColors.blue100],
    subtle: [BlueColors.blue50, BlueColors.blue100],
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

// Thème sombre
export const DarkTheme = {
  // Backgrounds
  background: {
    primary: '#0A0E1A',      // Bleu très très foncé
    secondary: '#1A2332',    // Bleu foncé
    accent: '#243447',       // Bleu moyen foncé
  },
  
  // Surfaces (cards, containers)
  surface: {
    primary: '#1A2332',      // Bleu foncé
    secondary: '#243447',    // Bleu moyen foncé
    accent: '#2D4A63',       // Bleu plus clair
    elevated: '#2D4A63',     // Pour les éléments en relief
  },
  
  // Textes
  text: {
    primary: '#E8F4FD',      // Bleu très clair
    secondary: '#B8D4EA',    // Bleu clair
    tertiary: '#7BA7D1',     // Bleu moyen
    inverse: NeutralColors.gray900,
    link: BlueColors.blue300,
  },
  
  // Bordures
  border: {
    light: '#2D4A63',
    medium: '#3D5A73',
    strong: '#4D6A83',
  },
  
  // Couleurs principales adaptées
  primary: BlueColors.blue400,        // Plus clair pour le dark
  primaryLight: BlueColors.blue300,   // Encore plus clair
  primaryDark: BlueColors.blue600,    // Contraste pour le dark
  secondary: BlueColors.blue500,
  
  // Gradients adaptés pour le dark
  gradients: {
    primary: [BlueColors.blue600, BlueColors.blue400],
    header: [BlueColors.primaryDark, BlueColors.blue700],
    accent: [BlueColors.blue400, BlueColors.blue200],
    subtle: ['#243447', '#2D4A63'],
  },
  
  // Status adaptés
  success: '#66BB6A',       // Plus clair pour visibilité
  warning: '#FFA726',       // Plus clair pour visibilité  
  error: '#EF5350',         // Plus clair pour visibilité
  info: BlueColors.blue400, // Plus clair pour visibilité
  
  // Couleurs complètes accessibles
  colors: {
    ...BlueColors,
    ...RedColors,
    ...GreenColors,
    ...NeutralColors,
  },
};

export type Theme = typeof LightTheme;