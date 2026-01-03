import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
}

export default function Logo({ size = 'medium', inline = false }: LogoProps) {
  const sizes = {
    small: 22,
    medium: 32,
    large: 42,
  };

  const fontSize = sizes[size];

  return (
    <View style={[styles.container, inline && styles.containerInline]}>
      <Text style={[styles.logo, { fontSize: fontSize }]}>
        <Text style={styles.accent}>QR</Text>
        <Text style={styles.text}>chek</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerInline: {
    alignItems: 'flex-start',
  },
  logo: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  accent: {
    color: theme.colors.primary,
  },
  text: {
    color: theme.colors.textPrimary,
  },
});

