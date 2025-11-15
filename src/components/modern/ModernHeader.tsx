import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightElement?: React.ReactNode;
  variant?: 'default' | 'accent' | 'subtle';
  style?: ViewStyle;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  icon,
  rightElement,
  variant = 'default',
  style,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const getGradientColors = () => {
    switch (variant) {
      case 'accent':
        return theme.gradients.accent;
      case 'subtle':
        return theme.gradients.subtle;
      default:
        return theme.gradients.header;
    }
  };

  const styles = StyleSheet.create({
    container: {
      paddingTop: insets.top + 10, // Dynamic Island compatible
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text.inverse,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.text.inverse,
      opacity: 0.8,
      marginTop: 2,
    },
    rightContent: {
      marginLeft: 16,
    },
    // Effet de mesh moderne
    meshOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
    },
  });

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {/* Effet mesh subtil */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.meshOverlay}
      />
      
      <View style={styles.content}>
        <View style={styles.leftContent}>
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons 
                name={icon} 
                size={24} 
                color={theme.text.inverse} 
              />
            </View>
          )}
          
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {rightElement && (
          <View style={styles.rightContent}>
            {rightElement}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};