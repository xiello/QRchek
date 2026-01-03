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
import { storeAuth } from '../services/auth';
import Logo from '../components/Logo';
import { theme, sk } from '../config/theme';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister, onNavigateToForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(sk.error, 'Zadajte email a heslo');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      await storeAuth(response.token, response.employee);
      onLoginSuccess();
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.needsVerification) {
        // Account pending admin approval
        Alert.alert(
          'Účet čaká na overenie',
          'Váš účet ešte nebol overený administrátorom. Kontaktujte administrátora pre overenie účtu.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Prihlásenie zlyhalo',
          errorData?.error || 'Neplatné prihlasovacie údaje. Skúste znova.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size="large" showTagline={true} />
        </View>

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
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{sk.password}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{sk.login}</Text>
            )}
          </TouchableOpacity>

          {onNavigateToForgotPassword && (
            <TouchableOpacity onPress={onNavigateToForgotPassword} disabled={loading} style={styles.forgotPasswordLink}>
              <Text style={styles.forgotPasswordText}>Zabudli ste heslo?</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={onNavigateToRegister} disabled={loading}>
          <Text style={styles.linkText}>
            {sk.dontHaveAccount} <Text style={styles.linkBold}>{sk.registerHere}</Text>
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
    marginBottom: 48,
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
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
