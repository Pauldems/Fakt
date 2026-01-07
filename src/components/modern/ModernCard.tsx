import React, { ReactNode, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme/colors';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient' | 'accent';
export type CardSize = 'small' | 'medium' | 'large';

interface ModernCardProps {
  children: ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  onPress,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      borderRadius: 16,
      overflow: 'hidden',
      opacity: disabled ? 0.6 : 1,
    },
    card: {
      borderRadius: 16,
      ...getSizeStyles(size),
      ...getVariantStyles(variant, theme),
    },
    pressable: {
      borderRadius: 16,
    },
    gradientCard: {
      flex: 1,
      borderRadius: 16,
      ...getSizeStyles(size),
    },
  }), [theme, size, variant, disabled]);

  const renderCard = () => {
    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={theme.gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCard}
        >
          {children}
        </LinearGradient>
      );
    }

    return (
      <View style={styles.card}>
        {children}
      </View>
    );
  };

  if (onPress && !disabled) {
    return (
      <View style={[styles.container, style]}>
        <Pressable
          style={styles.pressable}
          onPress={onPress}
          android_ripple={{
            color: theme.primary + '20',
            borderless: false,
          }}
        >
          {renderCard()}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {renderCard()}
    </View>
  );
};

// Utilitaires pour les styles
const getSizeStyles = (size: CardSize): ViewStyle => {
  switch (size) {
    case 'small':
      return { padding: 12 };
    case 'large':
      return { padding: 24 };
    default: // medium
      return { padding: 16 };
  }
};

const getVariantStyles = (variant: CardVariant, theme: Theme): ViewStyle => {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: theme.surface.elevated,
        shadowColor: theme.text.primary,
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
      };
    
    case 'outlined':
      return {
        backgroundColor: theme.surface.primary,
        borderWidth: 1,
        borderColor: theme.border.medium,
        shadowColor: theme.text.primary,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      };
    
    case 'accent':
      return {
        backgroundColor: theme.surface.accent,
        shadowColor: theme.text.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
      };
    
    case 'gradient':
      return {
        // Les styles sont appliqués dans le LinearGradient
      };
    
    default: // default
      return {
        backgroundColor: theme.surface.primary,
        shadowColor: theme.text.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      };
  }
};