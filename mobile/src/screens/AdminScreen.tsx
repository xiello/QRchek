import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { adminAPI, AdminStats, AdminEmployee } from '../services/api';
import { theme, sk } from '../config/theme';

type TabType = 'stats' | 'employees';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, employeesData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getEmployees()
      ]);
      setStats(statsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert(sk.error, 'Nepodarilo sa načítať dáta');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateRate = async (empId: string, newRate: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0) return;
    
    try {
      await adminAPI.updateEmployee(empId, { hourlyRate: rate });
      await loadData();
    } catch (error) {
      Alert.alert(sk.error, 'Nepodarilo sa aktualizovať sadzbu');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            {sk.stats}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'employees' && styles.activeTab]}
          onPress={() => setActiveTab('employees')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'employees' && styles.activeTabText]}>
            {sk.employees}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {activeTab === 'stats' && stats && (
          <>
            <Text style={styles.sectionTitle}>{sk.today}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.today.scans}</Text>
                <Text style={styles.statLabel}>{sk.scans}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.today.hours}h</Text>
                <Text style={styles.statLabel}>{sk.hours}</Text>
              </View>
              <View style={[styles.statCard, styles.highlightCard]}>
                <Text style={[styles.statValue, styles.highlightText]}>€{stats.today.payment}</Text>
                <Text style={[styles.statLabel, styles.highlightText]}>{sk.amountToPay}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{sk.thisWeek}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.week.scans}</Text>
                <Text style={styles.statLabel}>{sk.scans}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.week.hours}h</Text>
                <Text style={styles.statLabel}>{sk.hours}</Text>
              </View>
              <View style={[styles.statCard, styles.highlightCard]}>
                <Text style={[styles.statValue, styles.highlightText]}>€{stats.week.payment}</Text>
                <Text style={[styles.statLabel, styles.highlightText]}>{sk.amountToPay}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{sk.thisMonth}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.month.scans}</Text>
                <Text style={styles.statLabel}>{sk.scans}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.month.hours}h</Text>
                <Text style={styles.statLabel}>{sk.hours}</Text>
              </View>
              <View style={[styles.statCard, styles.highlightCard]}>
                <Text style={[styles.statValue, styles.highlightText]}>€{stats.month.payment}</Text>
                <Text style={[styles.statLabel, styles.highlightText]}>{sk.amountToPay}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{sk.recentActivity}</Text>
            {stats.recentActivity.slice(0, 5).map((record) => (
              <View key={record.id} style={styles.activityItem}>
                <View style={[styles.activityBadge, record.type === 'arrival' ? styles.arrivalBadge : styles.departureBadge]}>
                  <Text style={styles.badgeText}>{record.type === 'arrival' ? 'IN' : 'OUT'}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{record.employeeName}</Text>
                  <Text style={styles.activityTime}>
                    {new Date(record.timestamp).toLocaleString('sk-SK')}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'employees' && (
          <>
            <Text style={styles.sectionTitle}>{sk.employeePayments}</Text>
            {employees.map((emp) => (
              <View key={emp.id} style={styles.employeeCard}>
                <View style={styles.employeeHeader}>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>{emp.name}</Text>
                    <Text style={styles.employeeEmail}>{emp.email}</Text>
                    <View style={styles.badges}>
                      {emp.isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
                      {emp.emailVerified && <Text style={styles.verifiedBadge}>{sk.verified}</Text>}
                    </View>
                  </View>
                  <View style={styles.rateContainer}>
                    <Text style={styles.rateLabel}>€/h</Text>
                    <TextInput
                      style={styles.rateInput}
                      keyboardType="decimal-pad"
                      defaultValue={emp.hourlyRate.toString()}
                      onEndEditing={(e) => handleUpdateRate(emp.id, e.nativeEvent.text)}
                    />
                  </View>
                </View>
                
                <View style={styles.paymentBreakdown}>
                  <View style={styles.paymentItem}>
                    <Text style={styles.paymentPeriod}>{sk.today}</Text>
                    <Text style={styles.paymentHours}>{emp.today?.hours || 0}h</Text>
                    <Text style={styles.paymentAmount}>€{emp.today?.payment || 0}</Text>
                  </View>
                  <View style={styles.paymentDivider} />
                  <View style={styles.paymentItem}>
                    <Text style={styles.paymentPeriod}>{sk.week}</Text>
                    <Text style={styles.paymentHours}>{emp.week?.hours || 0}h</Text>
                    <Text style={styles.paymentAmount}>€{emp.week?.payment || 0}</Text>
                  </View>
                  <View style={styles.paymentDivider} />
                  <View style={styles.paymentItem}>
                    <Text style={styles.paymentPeriod}>{sk.month}</Text>
                    <Text style={styles.paymentHours}>{emp.month?.hours || 0}h</Text>
                    <Text style={styles.paymentAmount}>€{emp.month?.payment || 0}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlightCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  highlightText: {
    color: '#fff',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  arrivalBadge: {
    backgroundColor: theme.colors.success,
  },
  departureBadge: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  activityTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  employeeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  employeeEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  adminBadge: {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  rateContainer: {
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  rateInput: {
    width: 70,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.textPrimary,
  },
  paymentBreakdown: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.background,
  },
  paymentItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  paymentPeriod: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  paymentHours: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});
