import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { attendanceAPI } from '../services/api';
import { AttendanceRecord } from '../types/attendance';
import AttendanceCard from '../components/AttendanceCard';
import { theme, sk } from '../config/theme';

interface HistoryScreenProps {
  onRefresh?: () => void;
}

export default function HistoryScreen({ onRefresh }: HistoryScreenProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await attendanceAPI.getMyAttendance();
      setRecords(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
    onRefresh?.();
  };

  const handleEdit = (record: AttendanceRecord) => {
    const newType = record.type === 'arrival' ? 'departure' : 'arrival';
    const typeLabel = newType === 'arrival' ? sk.arrival : sk.departure;
    
    Alert.alert(
      'Zmeniť typ záznamu',
      `Zmeniť tento záznam na ${typeLabel}?`,
      [
        {
          text: sk.cancel,
          style: 'cancel',
        },
        {
          text: 'Zmeniť',
          onPress: async () => {
            try {
              await attendanceAPI.updateAttendanceType(record.id, newType);
              await loadHistory();
              Alert.alert(sk.success, `Záznam zmenený na ${typeLabel}`);
            } catch (error: any) {
              Alert.alert(
                sk.error,
                error.response?.data?.error || 'Nepodarilo sa aktualizovať záznam.'
              );
            }
          },
        },
      ]
    );
  };

  const handleDelete = (record: AttendanceRecord) => {
    const date = new Date(record.timestamp);
    const dateStr = date.toLocaleDateString('sk-SK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const typeLabel = record.type === 'arrival' ? sk.arrival : sk.departure;
    
    Alert.alert(
      'Vymazať záznam',
      `Naozaj chcete vymazať tento ${typeLabel.toLowerCase()} z ${dateStr}?`,
      [
        {
          text: sk.cancel,
          style: 'cancel',
        },
        {
          text: sk.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await attendanceAPI.deleteAttendance(record.id);
              await loadHistory();
              Alert.alert(sk.success, 'Záznam bol vymazaný');
            } catch (error: any) {
              Alert.alert(
                sk.error,
                error.response?.data?.error || 'Nepodarilo sa vymazať záznam.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{sk.history}</Text>
        <Text style={styles.subtitle}>{records.length} záznamov</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AttendanceCard record={item} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{sk.noRecords}</Text>
            <Text style={styles.emptySubtext}>Naskenujte QR kód pre začatie</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
