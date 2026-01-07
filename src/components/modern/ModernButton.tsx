import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Theme } from '../../theme/colors';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      borderRadius: 12,
      overflow: 'hidden',
      opacity: disabled ? 0.6 : 1,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      ...getSizeStyles(size),
      ...getVariantStyles(variant, theme),
    },
    text: {
      fontWeight: '600',
      textAlign: 'center',
      ...getTextSizeStyles(size),
      ...getTextVariantStyles(variant, theme),
    },
    iconLeft: {
      marginRight: 8,
    },
    iconRight: {
      marginLeft: 8,
    },
    gradientButton: {
      flex: 1,
    },
  }), [theme, size, variant, disabled]);

  const renderContent = () => (
    <View style={styles.button}>
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextVariantStyles(variant, theme).color}
          style={{ marginRight: icon || title ? 8 : 0 }}
        />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <Ionicons
          name={icon}
          size={getIconSize(size)}
          color={getTextVariantStyles(variant, theme).color}
          style={styles.iconLeft}
        />
      )}
      
      {title && (
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}
      
      {icon && iconPosition === 'right' && !loading && (
        <Ionicons
          name={icon}
          size={getIconSize(size)}
          color={getTextVariantStyles(variant, theme).color}
          style={styles.iconRight}
        />
      )}
    </View>
  );

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, styles.button, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Utilitaires pour les styles
const getSizeStyles = (size: ButtonSize): ViewStyle => {
  switch (size) {
    case 'small':
      return { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 };
    case 'large':
      return { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 };
    default: // medium
      return { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 };
  }
};

const getTextSizeStyles = (size: ButtonSize): TextStyle => {
  switch (size) {
    case 'small':
      return { fontSize: 14 };
    case 'large':
      return { fontSize: 18 };
    default: // medium
      return { fontSize: 16 };
  }
};

const getIconSize = (size: ButtonSize): number => {
  switch (size) {
    case 'small':
      return 16;
    case 'large':
      return 24;
    default: // medium
      return 20;
  }
};

const getVariantStyles = (variant: ButtonVariant, theme: Theme): ViewStyle => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: theme.surface.accent,
        borderWidth: 1,
        borderColor: theme.border.medium,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.primary,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
      };
    default: // primary
      return {
        // Le gradient est appliqué séparément
      };
  }
};

const getTextVariantStyles = (variant: ButtonVariant, theme: Theme): TextStyle => {
  switch (variant) {
    case 'secondary':
      return { color: theme.text.primary };
    case 'outline':
      return { color: theme.primary };
    case 'ghost':
      return { color: theme.primary };
    default: // primary
      return { color: theme.text.inverse };
  }
};