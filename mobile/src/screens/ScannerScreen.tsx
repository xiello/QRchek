import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
// @ts-ignore - expo-camera types may be outdated
import { CameraView, useCameraPermissions } from 'expo-camera';
import { attendanceAPI } from '../services/api';
import { getEmployee } from '../services/auth';
import { Employee, AttendanceRecord } from '../types/attendance';
import { theme, sk } from '../config/theme';
import { isOnline, queueScan, syncQueuedScans, getPendingScanCount } from '../services/offlineQueue';

interface ScannerScreenProps {
  onScanSuccess: (record: AttendanceRecord) => void;
}

export default function ScannerScreen({ onScanSuccess }: ScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingScans, setPendingScans] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadEmployee();
    checkNetworkAndSync();
    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const loadEmployee = async () => {
    const emp = await getEmployee();
    setEmployee(emp);
  };

  const checkNetworkAndSync = async () => {
    const online = await isOnline();
    setIsOffline(!online);
    
    if (online) {
      // Try to sync any queued scans
      const result = await syncQueuedScans();
      if (result.synced > 0) {
        Alert.alert(
          'Offline skeny synchronizované',
          `${result.synced} sken(ov) bolo synchronizovaných.`
        );
      }
    }
    
    // Update pending count
    const count = await getPendingScanCount();
    setPendingScans(count);
  };

  const startCooldownTimer = (seconds: number) => {
    setCooldownSeconds(seconds);
    setScanned(true);
    
    if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
    }
    
    cooldownRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
          }
          setScanned(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading || cooldownSeconds > 0) return;

    setScanned(true);
    setLoading(true);

    // Check network status
    const online = await isOnline();
    setIsOffline(!online);

    if (!online) {
      // Offline mode: queue the scan
      try {
        await queueScan(data);
        const count = await getPendingScanCount();
        setPendingScans(count);
        
        Alert.alert(
          'Offline režim',
          'Ste offline. Sken bol uložený a bude synchronizovaný keď budete online.',
          [
            {
              text: 'OK',
              onPress: () => {
                startCooldownTimer(60);
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert(
          sk.error,
          'Nepodarilo sa uložiť sken offline.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Online mode: send scan to server
    try {
      const response = await attendanceAPI.recordScan(data);
      const record = response.record;
      
      const typeText = record.type === 'arrival' ? sk.arrival : sk.departure;
      const time = new Date(record.timestamp).toLocaleTimeString();
      
      Alert.alert(
        sk.scanSuccessful,
        `${typeText} ${sk.recordedAt} ${time}`,
        [
          {
            text: 'OK',
            onPress: () => {
              onScanSuccess(record);
              startCooldownTimer(60);
            },
          },
        ]
      );
    } catch (error: any) {
      const errorData = error.response?.data;
      
      if (errorData?.cooldown) {
        startCooldownTimer(errorData.remainingSeconds || 60);
      } else if (errorData?.invalidQR) {
        Alert.alert(
          sk.invalidQRCode,
          sk.scanOfficialQR,
          [{ text: sk.tryAgain, onPress: () => setScanned(false) }]
        );
      } else if (error.message === 'Network Error' || !error.response) {
        // Network error - queue the scan
        try {
          await queueScan(data);
          const count = await getPendingScanCount();
          setPendingScans(count);
          setIsOffline(true);
          
          Alert.alert(
            'Chyba pripojenia',
            'Nepodarilo sa pripojiť k serveru. Sken bol uložený a bude synchronizovaný neskôr.',
            [
              {
                text: 'OK',
                onPress: () => {
                  startCooldownTimer(60);
                },
              },
            ]
          );
        } catch (queueError) {
          Alert.alert(
            sk.error,
            'Nepodarilo sa zaznamenať dochádzku.',
            [{ text: 'OK', onPress: () => setScanned(false) }]
          );
        }
      } else {
        Alert.alert(
          sk.error,
          errorData?.error || 'Nepodarilo sa zaznamenať dochádzku. Skúste znova.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Povolenie kamery</Text>
          <Text style={styles.permissionText}>{sk.cameraPermission}</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{sk.grantPermission}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{sk.scanQRCode}</Text>
        {employee && (
          <Text style={styles.employeeText}>{sk.loggedInAs}: {employee.name}</Text>
        )}
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>📴 Offline režim</Text>
          </View>
        )}
        {pendingScans > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>⏳ {pendingScans} čaká na synchronizáciu</Text>
          </View>
        )}
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned || cooldownSeconds > 0 ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        {/* Scan frame overlay */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Zaznamenávam dochádzku...</Text>
          </View>
        )}
        
        {cooldownSeconds > 0 && !loading && (
          <View style={styles.cooldownOverlay}>
            <View style={styles.cooldownContent}>
              <Text style={styles.cooldownCheck}>✓</Text>
              <Text style={styles.cooldownTitle}>Zaznamenané!</Text>
              <View style={styles.cooldownTimerContainer}>
                <Text style={styles.cooldownTimer}>{cooldownSeconds}</Text>
                <Text style={styles.cooldownTimerLabel}>sekúnd</Text>
              </View>
              <Text style={styles.cooldownText}>Počkajte pred ďalším skenovaním</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {cooldownSeconds > 0 ? (
          <Text style={styles.instruction}>
            Počkajte {cooldownSeconds}s pred ďalším skenovaním
          </Text>
        ) : (
          <Text style={styles.instruction}>{sk.pointCamera}</Text>
        )}
        {scanned && !loading && cooldownSeconds === 0 && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setScanned(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{sk.scanAgain}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  employeeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    right: '15%',
    bottom: '25%',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownContent: {
    alignItems: 'center',
  },
  cooldownCheck: {
    fontSize: 64,
    color: '#fff',
    marginBottom: 16,
  },
  cooldownTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  cooldownTimerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cooldownTimer: {
    color: '#fff',
    fontSize: 80,
    fontWeight: 'bold',
    lineHeight: 80,
  },
  cooldownTimerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 4,
  },
  cooldownText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  instruction: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineBadge: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 8,
  },
  offlineBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 8,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
