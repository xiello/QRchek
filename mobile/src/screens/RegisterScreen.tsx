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
  ScrollView,
  StatusBar,
} from 'react-native';
import { authAPI } from '../services/api';
import Logo from '../components/Logo';
import { theme, sk } from '../config/theme';

interface RegisterScreenProps {
  onRegisterSuccess: (email: string) => void;
  onBackToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onBackToLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(sk.error, 'Zadajte svoje meno');
      return;
    }
    if (!email.trim()) {
      Alert.alert(sk.error, 'Zadajte svoj email');
      return;
    }
    if (!password.trim()) {
      Alert.alert(sk.error, 'Zadajte heslo');
      return;
    }
    if (password.length < 6) {
      Alert.alert(sk.error, 'Heslo musí mať aspoň 6 znakov');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(sk.error, 'Heslá sa nezhodujú');
      return;
    }

    setLoading(true);
    try {
      await authAPI.register(name, email, password);
      Alert.alert(
        'Registrácia úspešná',
        'Váš účet bol vytvorený a čaká na overenie administrátorom. Budete sa môcť prihlásiť po overení účtu.',
        [{ text: 'OK', onPress: () => onRegisterSuccess(email) }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        Alert.alert(
          'Účet už existuje',
          'Účet s týmto emailom už existuje. Môžete sa prihlásiť alebo použiť iný email.',
          [
            { text: 'Prihlásiť sa', onPress: () => onBackToLogin() },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else if (error.message === 'Network Error' || !error.response) {
        Alert.alert(
          'Chyba pripojenia',
          'Nepodarilo sa pripojiť k serveru. Skontrolujte svoje internetové pripojenie a skúste to znova.',
          [{ text: 'OK' }]
        );
      } else {
        const errorMessage = error.response?.data?.error || 'Registrácia zlyhala. Skúste to znova.';
        Alert.alert('Registrácia zlyhala', errorMessage);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Logo size="medium" showTagline={true} />
          </View>

          <Text style={styles.title}>{sk.register}</Text>
          <Text style={styles.subtitle}>Vytvorte si účet pre sledovanie dochádzky</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{sk.name}</Text>
              <TextInput
                style={styles.input}
                placeholder="Vaše meno"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

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
                placeholder="Min. 6 znakov"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{sk.confirmPassword}</Text>
              <TextInput
                style={styles.input}
                placeholder="Zopakujte heslo"
                placeholderTextColor={theme.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={handleRegister}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{sk.register}</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onBackToLogin} disabled={loading}>
            <Text style={styles.linkText}>
              {sk.alreadyHaveAccount} <Text style={styles.linkBold}>{sk.loginHere}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: theme.colors.textSecondary,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
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
});
