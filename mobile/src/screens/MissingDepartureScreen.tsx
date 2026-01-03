import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { AttendanceRecord } from '../types/attendance';
import { attendanceAPI } from '../services/api';
import { theme } from '../config/theme';

interface MissingDepartureScreenProps {
  record: AttendanceRecord;
  onConfirmed: () => void;
  onDismiss: () => void;
}

export default function MissingDepartureScreen({ 
  record, 
  onConfirmed,
  onDismiss 
}: MissingDepartureScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await attendanceAPI.confirmDeparture(record.id);
      onConfirmed();
    } catch (error) {
      console.error('Error confirming departure:', error);
      // Still dismiss - the confirmation failed but we don't want to block the user
      onDismiss();
    } finally {
      setLoading(false);
    }
  };

  const departureTime = new Date(record.timestamp).toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const departureDate = new Date(record.timestamp).toLocaleDateString('sk-SK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⚠️</Text>
        
        <Text style={styles.title}>Zabudli ste sa odhlásiť</Text>
        
        <Text style={styles.subtitle}>
          Dňa {departureDate} ste sa neodhlásiť z práce.
        </Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Automatický odchod zaznamenaný o</Text>
          <Text style={styles.infoValue}>{departureTime}</Text>
        </View>
        
        <Text style={styles.description}>
          Potvrďte prosím, že ste odišli o 20:00.
        </Text>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>✓ Potvrdiť odchod o 20:00</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          disabled={loading}
        >
          <Text style={styles.dismissButtonText}>Pripomenúť neskôr</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff9800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  infoBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: 12,
  },
  dismissButtonText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
});
