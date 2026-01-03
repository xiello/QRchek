import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';
import { theme, sk } from '../config/theme';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordScreen({ onBackToLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(sk.error, 'Zadajte emailovú adresu');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(sk.error, 'Zadajte platnú emailovú adresu');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (error: any) {
      // Even on error, show success message to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Logo size="medium" showTagline={false} />
          </View>

          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>Email odoslaný</Text>
            <Text style={styles.successText}>
              Ak účet s emailom {email} existuje, dostanete email s inštrukciami na obnovenie hesla.
            </Text>
            <Text style={styles.successNote}>
              Skontrolujte aj priečinok spam.
            </Text>
          </View>

          <TouchableOpacity onPress={onBackToLogin} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Späť na prihlásenie</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size="medium" showTagline={false} />
        </View>

        <Text style={styles.title}>Zabudli ste heslo?</Text>
        <Text style={styles.subtitle}>
          Zadajte svoju emailovú adresu a pošleme vám odkaz na obnovenie hesla.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{sk.email}</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleForgotPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Odoslať odkaz</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onBackToLogin} disabled={loading}>
          <Text style={styles.linkText}>
            ← Späť na <Text style={styles.linkBold}>prihlásenie</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 20,
  },
  linkBold: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    marginBottom: 32,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  successNote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
